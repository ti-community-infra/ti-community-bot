FROM node:12-alpine

RUN mkdir -p /usr/src/app

WORKDIR /usr/src/app

COPY package.json package-lock.json /usr/src/app/

RUN apk --no-cache --virtual build-dependencies add \
    python \
    make \
    g++

RUN npm install

COPY . /usr/src/app

RUN npm run build

EXPOSE 3100
CMD ["npm", "start"]
