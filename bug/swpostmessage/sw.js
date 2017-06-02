self.addEventListener("message", function (event) {
    var name = event.data.name;

    if (name === "hello") {
        self.clients.get(event.source.id).then(function (client) {
            client.postMessage({
                name: "hello",
                user: "world"
            });
        });
    }
});
