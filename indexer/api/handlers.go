package api

import (
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"time"

	"trusttrove/indexer/config"

	"github.com/golang-jwt/jwt/v5"
	"github.com/stellar/go-stellar-sdk/keypair"
	"github.com/stellar/go-stellar-sdk/txnbuild"
)

type APIHandler struct {
	cfg      *config.Config
	serverKP *keypair.Full
}

func NewAPIHandler(cfg *config.Config) (*APIHandler, error) {
	kp, err := GetServerKeypair(cfg.JWTSecret)
	if err != nil {
		return nil, err
	}
	return &APIHandler{
		cfg:      cfg,
		serverKP: kp,
	}, nil
}

// GetServerKeypair derives a keypair deterministically from the JWT secret
func GetServerKeypair(jwtSecret string) (*keypair.Full, error) {
	hash := sha256.Sum256([]byte(jwtSecret))
	return keypair.FromRawSeed(hash)
}

// GenerateChallenge constructs and signs a SEP-10 challenge transaction
func GenerateChallenge(serverKP *keypair.Full, clientAddr string, passphrase string) (string, error) {
	nonce := make([]byte, 48)
	if _, err := rand.Read(nonce); err != nil {
		return "", err
	}
	nonceStr := base64.StdEncoding.EncodeToString(nonce)

	tx, err := txnbuild.NewTransaction(txnbuild.TransactionParams{
		SourceAccount: &txnbuild.SimpleAccount{
			AccountID: serverKP.Address(),
			Sequence:  0,
		},
		IncrementSequenceNum: false,
		BaseFee:              txnbuild.MinBaseFee,
		Timebounds:           txnbuild.NewTimebounds(time.Now().Unix(), time.Now().Add(15*time.Minute).Unix()),
		Operations: []txnbuild.Operation{
			&txnbuild.ManageData{
				SourceAccount: clientAddr,
				Name:          "trusttrove auth",
				Value:         []byte(nonceStr[:64]),
			},
		},
	})
	if err != nil {
		return "", err
	}

	tx, err = tx.Sign(passphrase, serverKP)
	if err != nil {
		return "", err
	}

	return tx.Base64()
}

// VerifyChallenge parses the signed transaction and checks the server and client signatures
func VerifyChallenge(signedXDR string, serverKP *keypair.Full, passphrase string) (string, error) {
	genericTx, err := txnbuild.Parse(signedXDR)
	if err != nil {
		return "", fmt.Errorf("failed to parse XDR: %w", err)
	}

	tx, ok := genericTx.Transaction()
	if !ok {
		return "", errors.New("invalid transaction type")
	}

	if tx.SourceAccount().GetAccountID() != serverKP.Address() {
		return "", errors.New("invalid server source account")
	}

	if len(tx.Operations()) != 1 {
		return "", errors.New("must contain exactly one operation")
	}

	op, ok := tx.Operations()[0].(*txnbuild.ManageData)
	if !ok {
		return "", errors.New("operation must be ManageData")
	}

	clientAddr := op.SourceAccount
	if clientAddr == "" {
		return "", errors.New("client source account is empty")
	}

	if op.Name != "trusttrove auth" {
		return "", fmt.Errorf("invalid operation name: %s", op.Name)
	}

	tb := tx.Timebounds()
	if tb == nil {
		return "", errors.New("timebounds must be set")
	}
	now := time.Now().Unix()
	if now < tb.MinTime || now > tb.MaxTime {
		return "", errors.New("challenge has expired or is not yet valid")
	}

	txHash, err := tx.Hash(passphrase)
	if err != nil {
		return "", fmt.Errorf("failed to get transaction hash: %w", err)
	}

	signatures := tx.Signatures()
	serverSigned := false
	clientSigned := false

	for _, sig := range signatures {
		serverKPCheck, _ := keypair.Parse(serverKP.Address())
		if err := serverKPCheck.Verify(txHash[:], sig.Signature); err == nil {
			serverSigned = true
			continue
		}

		clientKP, err := keypair.Parse(clientAddr)
		if err != nil {
			continue
		}
		if err := clientKP.Verify(txHash[:], sig.Signature); err == nil {
			clientSigned = true
		}
	}

	if !serverSigned {
		return "", errors.New("missing server signature")
	}
	if !clientSigned {
		return "", errors.New("missing client signature")
	}

	return clientAddr, nil
}

// GenerateJWT creates a JWT token signed by the server's secret
func GenerateJWT(address string, jwtSecret string, expiryHours int) (string, error) {
	claims := jwt.MapClaims{
		"sub": address,
		"exp": time.Now().Add(time.Duration(expiryHours) * time.Hour).Unix(),
		"iat": time.Now().Unix(),
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(jwtSecret))
}

// GET /auth
func (h *APIHandler) HandleGetAuth(w http.ResponseWriter, r *http.Request) {
	address := r.URL.Query().Get("address")
	if address == "" {
		http.Error(w, "missing address parameter", http.StatusBadRequest)
		return
	}

	// Validate client address format
	_, err := keypair.Parse(address)
	if err != nil {
		http.Error(w, "invalid address format", http.StatusBadRequest)
		return
	}

	xdrString, err := GenerateChallenge(h.serverKP, address, h.cfg.NetworkPassphrase)
	if err != nil {
		http.Error(w, fmt.Sprintf("failed to generate challenge: %s", err.Error()), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"transaction":        xdrString,
		"network_passphrase": h.cfg.NetworkPassphrase,
	})
}

// POST /auth
func (h *APIHandler) HandlePostAuth(w http.ResponseWriter, r *http.Request) {
	var body struct {
		Transaction string `json:"transaction"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	if body.Transaction == "" {
		http.Error(w, "missing transaction parameter", http.StatusBadRequest)
		return
	}

	clientAddr, err := VerifyChallenge(body.Transaction, h.serverKP, h.cfg.NetworkPassphrase)
	if err != nil {
		http.Error(w, fmt.Sprintf("challenge verification failed: %s", err.Error()), http.StatusUnauthorized)
		return
	}

	token, err := GenerateJWT(clientAddr, h.cfg.JWTSecret, h.cfg.JWTExpiryHours)
	if err != nil {
		http.Error(w, "failed to generate authentication token", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"token": token,
	})
}
