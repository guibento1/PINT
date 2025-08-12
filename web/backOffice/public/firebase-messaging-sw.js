self.addEventListener("push", function (event) {
  const data = event.data.json();
  const { title, body } = data.notification;
  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: "/logo.png",
    })
  );

  self.clients
    .matchAll({ includeUncontrolled: true, type: "window" })
    .then(function (clients) {
      clients.forEach(function (client) {
        client.postMessage({ type: "novaNotificacao" });
      });
    });
});
