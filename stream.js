const params = new URLSearchParams(window.location.search);
const vId = params.get('v');
const bId = params.get('b');
const sub = params.get('sub');
const top = params.get('top');

if (vId && bId) {
    loadLecture(vId, bId, sub, top);
}
