FROM node:14-alpine as builder

WORKDIR /usr/src/app

COPY package*.json ./

RUN apk --no-cache --virtual build-dependencies add \
  python \
  make \
  g++

RUN npm install

FROM node:14-alpine as app

WORKDIR /usr/src/app

COPY --from=builder /usr/src/app/node_modules/ ./node_modules/

COPY . ./
RUN rm -rf /usr/src/app/lib

RUN npm run build

ENV NODE_ENV="production"
EXPOSE 3100

CMD [ "npm", "start" ]
