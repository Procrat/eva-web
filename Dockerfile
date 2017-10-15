FROM procrat/rust-asmjs

RUN git clone https://github.com/Procrat/eva-web
WORKDIR eva-web

RUN make dependencies
