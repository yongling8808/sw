self.addEventListener('install', function() {
  self.skipWaiting();
});

self.addEventListener('activate', function(event) {
  event.waitUntil(clients.claim());
});

self.addEventListener('notificationclick', function(event) {
  // Close the notification when it is clicked
  //event.notification.close();
  event.waitUntil(handleNotificationClick(event));
});


//Utility function to handle the click
function handleNotificationClick(evt) {
    evt.notification.close();
//    var iconURL = evt.notification.icon;
//    if (iconURL.indexOf("?") > -1) {
//        var queryString = iconURL.split("?")[1];
//        var query = parseQueryString(queryString);
//        if (query.url && query.url.length == 1) {
//            if (_roostSW.logging) console.log("Opening URL: " + query.url[0]);
//            return clients.openWindow(query.url[0]);
//        }
//    }
clients.openWindow('https://yongling8808.github.io/sw/notifications/requireInteraction.html');
    console.log("Failed to redirect to notification for iconURL: " + iconURL);
}