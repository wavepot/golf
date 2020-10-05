rollup -f es script.js >build.js
#rollup -f es editor/worker.js >worker.js

cp fonts/* backend/public/fonts/
cp *.js backend/public/
cp index.html backend/public/
cp style.css backend/public/
