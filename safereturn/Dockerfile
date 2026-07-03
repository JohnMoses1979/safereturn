FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./

RUN npm config set registry https://registry.npmjs.org/
RUN npm install

COPY . .

ARG VITE_API_BASE_URL
ARG REACT_APP_API_BASE_URL
ARG EXPO_PUBLIC_API_BASE_URL

ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV REACT_APP_API_BASE_URL=$REACT_APP_API_BASE_URL
ENV EXPO_PUBLIC_API_BASE_URL=$EXPO_PUBLIC_API_BASE_URL

RUN npx expo export --platform web

RUN mkdir -p /out && \
    if [ -d dist ]; then cp -r dist/* /out/; \
    elif [ -d build ]; then cp -r build/* /out/; \
    else echo "No dist or build folder found" && exit 1; fi

FROM nginx:alpine

COPY --from=build /out /usr/share/nginx/html

COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
