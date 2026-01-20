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
	var lastEvent *Event
	for {
		select {
		case c := <-register:
			clients[c.id] = c
			log.WithField("client", c.id).Info("client registered")
			if lastEvent != nil {
				sendEventToClient(c, *lastEvent)
			}
		case c := <-unregister:
			if _, ok := clients[c.id]; ok {
				delete(clients, c.id)
				log.WithField("client", c.id).Info("client unregistered")
			}
		case msg := <-broadcast:
			event := Event{ID: nextEventID, ReceivedAt: time.Now(), Data: msg}
			nextEventID++
			lastEvent = &event
			for _, c := range clients {
				sendEventToClient(c, event)
			}
		}
	}
}

// sendEventToClient attempts to send an event to a client with a timeout
func sendEventToClient(cl Client, ev Event) {
	go func() {
		timer := time.NewTimer(eventSendTimeout)
		defer timer.Stop()
		select {
		case cl.ch <- ev:
		case <-timer.C:
			log.WithFields(log.Fields{
				"client": cl.id,
				"event":  ev.ID,
			}).Warn("timeout sending event to client exceeded, ignoring event")
		}
	}()
}
