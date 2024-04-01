import React, { useEffect, useState } from "react";
import "./App.css";
import { RetellWebClient } from "retell-client-js-sdk";

const agentId = "90e1bb1d626d3a2730250251c762d624";//a72f237cb17f0c0a1df2d17045b29ab5
const url = "://2ff2-103-21-124-76.ngrok-free.app";
interface RegisterCallResponse {
  callId?: string;
  sampleRate: number;
}

const webClient = new RetellWebClient();
const conversation = [{'role':'agent','content':'Red is the Assitant transcription'},{'role':'user','content':'Blue is Your transcription'}];

const App = () => {
  const [isCalling, setIsCalling] = useState(false);
  const [convo, setConvo] = useState<any>(null);
  const [selectedModel, setSelectedModel] = useState("gpt-4-1106-preview");

  const handleModelChange = (event) => {
  setSelectedModel(event.target.value);
  };
  // const [times, setTimes] = useState<any>(null);
  // Initialize the SDK
  useEffect(() => {
    setConvo(conversation)
    // setTimes(end_times)
    // Setup event listeners
    webClient.on("conversationStarted", () => {
      console.log("conversationStarted");
    });

    webClient.on("audio", (audio: Uint8Array) => {
      console.log("There is audio");
    });

    webClient.on("conversationEnded", ({ code, reason }) => {
      console.log("Closed with code:", code, ", reason:", reason);
      setIsCalling(false); // Update button to "Start" when conversation ends
    });

    webClient.on("error", (error) => {
      console.error("An error occurred:", error);
      setIsCalling(false); // Update button to "Start" in case of error
    });

    webClient.on("update", (update) => {
      console.log(update)
      setConvo(update.transcript);
      // if (update.transcript.length - prev_len === 1){
      //   const currentTimestampInSeconds = Math.floor(Date.now() / 1000);
      //   const update_times = [...times, currentTimestampInSeconds] ;
      //   setTimes(update_times);
      //   prev_len +=1
      // }
      // console.log(times)
    });
  }, []);

  const toggleConversation = async () => {
    if (isCalling) {
      webClient.stopConversation();
    } else {
      updateModel(selectedModel)
      const registerCallResponse = await registerCall(agentId);
      if (registerCallResponse.callId) {
        webClient
          .startConversation({
            callId: registerCallResponse.callId,
            sampleRate: registerCallResponse.sampleRate,
            enableUpdate: true,
          })
          .catch(console.error);
        setIsCalling(true); // Update button to "Stop" when conversation starts
      }
    }
  };

  async function registerCall(agentId: string): Promise<RegisterCallResponse> {
    try {
      // Replace with your server url
      const response = await fetch(
        "https"+ url + "/register-call",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            agentId: agentId,
          }),
        },
      );

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const data: RegisterCallResponse = await response.json();
      return data;
    } catch (err) {
      console.log(err);
      throw new Error(err);
    }
  }
  // Example API call to update the model
  const updateModel = async (model) => {
    try {
      const response = await fetch("https"+ url + "/update-model", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ model: model, }),
      });
      if (!response.ok) {
        throw new Error("Failed to update model");
      }
      // Handle success
    } catch (error) {
      console.error("Error updating model:", error);
    }
  };

  return (
    <div className="App">
      <h2>On call with Taha about Hersheys</h2>
      <select onChange={handleModelChange}>
        {/* <option value="claude-3-haiku-20240307" >Claude 3 Haiku</option> */}
        <option value="gpt-4-1106-preview">GPT-4</option>
        <option value="gpt-3.5-turbo-0125">GPT-3</option>
        <option value="mixtral-8x7b-32768">Mixtral</option>
        
      </select>
      <header className="App-header">
        <button onClick={toggleConversation}>
          {isCalling ? "Stop" : "Start"}
        </button>
        <ul>
        {convo && convo.map((message,index) =>(
          <li key={index}>
            {message.role === "agent"?(
              <span style={{color: "red"}}>{message.content}</span> ):(
              <span style={{color: "blue"}}>{message.content}</span>
            )}
          </li>
        ))
        }
      </ul>
      </header>
    </div>
  );
};

export default App;
