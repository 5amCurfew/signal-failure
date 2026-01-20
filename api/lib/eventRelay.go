package lib

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"strings"
	"time"

	log "github.com/sirupsen/logrus"
)

const (
	defaultPulseURL  = "https://jsonplaceholder.typicode.com/todos/1"
	apiPulseInterval = 10 * time.Second
)

// PulsePayload represents the JSON payload returned by the upstream Pulse endpoint
type PulsePayload any

// PulseResponse wraps the decoded payload along with its raw JSON bytes
type PulseResponse struct {
	Raw  json.RawMessage
	Data PulsePayload
}

var HTTPClient = &http.Client{Timeout: 10 * time.Second}
var broadcast = make(chan json.RawMessage, broadcastQueueSize)

// Broadcast fan-outs a payload to all connected clients.
func Broadcast(msg json.RawMessage) {
	broadcast <- msg
}

func EventRelay() {
	url := strings.TrimSpace(os.Getenv("PULSE_URL"))
	if url == "" {
		url = defaultPulseURL
	}

	ticker := time.NewTicker(apiPulseInterval)
	defer ticker.Stop()

	//var lastHash string

	for {
		if resp, err := fetch(url); err != nil {
			log.WithError(err).WithField("url", url).Warn("api Pulse failed")
		} else {
			Broadcast(resp.Raw)
		}

		<-ticker.C
	}
}

func fetch(url string) (PulseResponse, error) {
	req, err := http.NewRequest(http.MethodGet, url, nil)
	if err != nil {
		return PulseResponse{}, err
	}

	req.Header.Set("User-Agent", "signal-failure/1.0")
	req.Header.Set("Accept", "application/json")

	resp, err := HTTPClient.Do(req)
	if err != nil {
		return PulseResponse{}, err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return PulseResponse{}, err
	}

	if resp.StatusCode != http.StatusOK {
		return PulseResponse{}, fmt.Errorf("Pulse request failed: status=%d body=%s", resp.StatusCode, strings.TrimSpace(string(body)))
	}

	var payload PulsePayload
	if err := json.Unmarshal(body, &payload); err != nil {
		return PulseResponse{}, fmt.Errorf("decode Pulse response: %w", err)
	}

	return PulseResponse{Raw: json.RawMessage(body), Data: payload}, nil
}
