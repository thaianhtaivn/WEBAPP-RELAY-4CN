import "./App.scss";
import { Client, Message } from "paho-mqtt";
import { useState, useEffect, useCallback } from "react";

const options = {
  host: "42c1410bece7497a99cfa15427041510.s2.eu.hivemq.cloud",
  port: 8884,
  protocol: "mqtts",
  username: "dien-tu-tieu-hoc",
  password: "1234567890",
};

const defaultRelayData = [
  { name: "RELAY 1", state: false },
  { name: "RELAY 2", state: false },
  { name: "RELAY 3", state: false },
  { name: "RELAY 4", state: false },
];

function App() {
  const [client, setClient] = useState(null);
  const [relayData, setRelayData] = useState(defaultRelayData);
  const [relayID, setRelayID] = useState("relay-demo");

  const handleSwitch = useCallback(
    (value) => {
      const data = { name: value.name, state: "toggle" };
      const message = new Message("ACTION:" + JSON.stringify(data));
      message.destinationName = relayID;
      message.qos = 0;
      client.send(message);
    },
    [client, relayID]
  );

  useEffect(() => {
    const clientId = `client-id-${relayID}-${Math.random()}`;
    const newClient = new Client(options.host, options.port, clientId);

    setClient(newClient);

    function connect() {
      // set callback handlers
      newClient.onConnectionLost = onConnectionLost;
      newClient.onMessageArrived = onMessageArrived;

      // set options
      const connectOptions = {
        onSuccess: onConnect,
        useSSL: true,
        userName: options.username,
        password: options.password,
      };
      newClient.connect(connectOptions);
    }

    function onConnect() {
      newClient.subscribe(`${relayID}-STATUS`);
      const message = new Message("REQUEST:?");
      message.destinationName = relayID;
      message.qos = 0;
      newClient.send(message);
    }

    function onConnectionLost(responseObject) {
      if (responseObject.errorCode !== 0) {
        console.log("Connection lost:", responseObject.errorMessage);
      }
    }

    function onMessageArrived(message) {
      const jsonStr = message.payloadString.substring("STATUS:".length);
      const jsonObj = JSON.parse(jsonStr.replace(/([A-Za-z0-9_\-]+)(\s*:\s*)([01])([,}]|$)/g, '"$1": $3$4'));

      const output = Object.entries(jsonObj).map(([key, value], index) => ({
        name: defaultRelayData[index].name,
        state: value === 1,
      }));
      setRelayData(output);
    }

    connect();

    return () => {
      newClient.disconnect();
    };
  }, [relayID]);

  return (
    <div className="App">
      <div className="app-header">
        <h3>RELAY CONTROLLER APP</h3>
      </div>
      <div className="switch-btns">
        <div className="relay-id d-flex mb-3">
          <label className="col-form-label me-2">Relay ID:</label>
          <div className="col">
            <input type="email" className="form-control" placeholder="Relay ID" onChange={(e) => setRelayID(e.target.value)} />
          </div>
        </div>
        {relayData.map((item, index) => (
          <div className="form-check form-switch ps-0 mb-2" key={index}>
            <label className="">{item.name}</label>
            <input className="form-check-input" type="checkbox" checked={item.state} onChange={() => handleSwitch(item)} />
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
