console.log('in service-worker.js, location: ', location.href);
try {
    importScripts('common.bundle.js', 'bgHelper.bundle.js');
} catch (e) {
    console.log('Error importing scripts: ' + e);
}
