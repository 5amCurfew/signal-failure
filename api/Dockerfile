# Use a small Go base image
FROM golang:1.24-alpine

WORKDIR /app

# Copy and download dependencies first (cache here)
COPY go.mod go.sum ./
RUN go mod download
RUN go mod tidy

COPY . .

RUN go build -o main .
EXPOSE 8080

CMD ["/app/main"]

# docker build -t signal-failure-api .
# docker run -p 8080:8080 signal-failure-api
