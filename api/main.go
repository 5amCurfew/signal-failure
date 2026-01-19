package main

import (
	"net/http"
	"os"
	"sync"

	lib "github.com/5amCurfew/signal-failure/lib"
	log "github.com/sirupsen/logrus"
)

var eventBrokerOnce sync.Once
var eventRelayOnce sync.Once

// StartEventBroker starts the event broker goroutine
func StartEventBroker() {
	eventBrokerOnce.Do(func() {
		go lib.EventBroker()
	})
}

// StartEventRelay starts the event relay goroutine
func StartEventRelay() {
	eventRelayOnce.Do(func() {
		go lib.EventRelay()
	})
}

func main() {
	log.SetFormatter(&log.JSONFormatter{})
	log.SetOutput(os.Stdout)
	log.SetLevel(log.InfoLevel)

	StartEventBroker()
	http.HandleFunc("/events", lib.EventsHandler)

	StartEventRelay()

	port := os.Getenv("PORT")
	if port == "" {
		port = "3000"
	}

	log.Infof("http server running at http://localhost:%s", port)
	if err := http.ListenAndServe(":"+port, nil); err != nil {
		log.WithError(err).Fatal("http server failed")
	}

}
