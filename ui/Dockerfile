FROM node:20-bullseye
WORKDIR /app

ENV EXPO_WEB_PORT=8080

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 8080
CMD ["npm", "start"]
