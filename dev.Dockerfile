FROM node:14-alpine

WORKDIR /usr/src/app

COPY package*.json ./

RUN apk --no-cache --virtual build-dependencies add \
  python \
  make \
  g++

RUN npm install

COPY . ./

EXPOSE 3000
CMD ["npm", "run", "dev"]
