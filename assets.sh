rollup -f es wavepot.js >build.js
rollup -f es wavepot-worker.js >wavepot-worker-build.js
rollup -f es plot-worker.js >plot-worker-build.js
#rollup -f es editor/editor.js >editor.js
rollup -f es editor/editor-worker.js >editor-worker.js

cp fonts/* backend/public/fonts/
cp *.js backend/public/
cp build.html backend/public/index.html
cp style.css backend/public/
cp favicon.ico backend/public/
