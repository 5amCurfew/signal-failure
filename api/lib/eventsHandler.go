package lib

import (
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	log "github.com/sirupsen/logrus"
)

func setCORSHeaders(w http.ResponseWriter) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Cache-Control, Content-Type, X-Requested-With")
	w.Header().Set("Access-Control-Max-Age", "86400")
}

func EventsHandler(w http.ResponseWriter, r *http.Request) {
	setCORSHeaders(w)
	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusNoContent)
		return
	}
	// Configure Server-Sent Events (SSE) headers
	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")

	flusher, ok := w.(http.Flusher)
	if !ok {
		http.Error(w, "Streaming unsupported", http.StatusInternalServerError)
		return
	}

	client := Client{
		id: fmt.Sprintf("client-%d", time.Now().UnixNano()),
		ch: make(chan Event, clientQueueSize),
	}

	register <- client
	ctx := r.Context()
	// Stream events to the connected client until their context is cancelled
	for {
		select {
		case event, ok := <-client.ch:
			if !ok {
				return
			}

			jsonPayload, err := json.Marshal(event)
			if err != nil {
				log.WithError(err).WithField("client", client.id).Error("marshal event payload failed")
				continue
			}

			frame := append([]byte("data: "), jsonPayload...)
			frame = append(frame, '\n', '\n')
			if _, err := w.Write(frame); err != nil {
				log.WithError(err).WithField("client", client.id).Error("write event payload failed")
				return
			}
			flusher.Flush()
		case <-ctx.Done():
			unregister <- client
			return
		}
	}
}
