FROM node:lts

WORKDIR /app/website

EXPOSE 3000 35729
#COPY ./docs /app/docs
COPY ./docusaurus-site /app/website
RUN yarn install

CMD ["yarn", "start"]
