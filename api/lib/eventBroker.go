package lib

import (
	"encoding/json"
	"time"

	log "github.com/sirupsen/logrus"
)

type Event struct {
	ID         uint64          `json:"ID"`
	ReceivedAt time.Time       `json:"ReceivedAt"`
	Data       json.RawMessage `json:"Data"`
}

type Client struct {
	id string
	ch chan Event
}

const (
	clientQueueSize    = 32
	broadcastQueueSize = 256
	eventSendTimeout   = 10 * time.Second
)

var (
	register   = make(chan Client)
	unregister = make(chan Client)
)

// EventBroker manages client registrations and broadcasts messages to them
func EventBroker() {
	clients := map[string]Client{}
	var nextEventID uint64
	for {
		select {
		case c := <-register:
			clients[c.id] = c
			log.WithField("client", c.id).Info("client registered")
		case c := <-unregister:
			if _, ok := clients[c.id]; ok {
				delete(clients, c.id)
				log.WithField("client", c.id).Info("client unregistered")
			}
		case msg := <-broadcast:
			event := Event{ID: nextEventID, ReceivedAt: time.Now(), Data: msg}
			nextEventID++
			for _, c := range clients {
				client := c
				go func(cl Client, ev Event) {
					timer := time.NewTimer(eventSendTimeout)
					defer timer.Stop()
					select {
					// Allow timeout for sending message on to client channel (buffered)
					// If sending takes too long, drop the message for that client
					case cl.ch <- ev:
					case <-timer.C:
						log.WithFields(log.Fields{
							"client": cl.id,
							"event":  ev.ID,
						}).Warn("timeout sending event to client exceeded, ignoring event")
					}
				}(client, event)
			}
		}
	}
}
