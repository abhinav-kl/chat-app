let socket = io.connect('http://' + document.domain + ':' + location.port);
// let socket = io.connect('http://127.0.0.1:5000/');
var selectedUserId = null;
var messageCounter;

socket.on('connect', function () {
  console.log('Connected to server');
});
socket.on('disconnect', function () {
  console.log('Server disconnected');
});

// socket
socket.on('message', (data) => {
  // console.log('new data-', data);
  if (
    (data.sender == user_id && data.receiver == selectedUserId) ||
    (data.sender == selectedUserId && data.receiver == user_id)
  ) {
    // if the user and selectedUser are inside the room then update the is_read to true
    fetch('/update_message', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        selectedUserId: selectedUserId,
        messageCounter: messageCounter,
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        // console.log('hhhhh', data);
        messageCounter = data;
        for (id in messageCounter) {
          receivedCount = document.getElementById(id);
          receivedCount.innerText = messageCounter[id];
        }
      });
  } else {
    // when the two users are not in the same room then increment the counter
    let receivedElement = document.getElementById(data.sender);
    if (receivedElement) {
      if (!messageCounter[data.sender]) {
        messageCounter[data.sender] = 0;
      }
      messageCounter[data.sender] += 1;
      receivedElement.innerHTML = messageCounter[data.sender];
    }
  }
  displayMessages(data);
});

document.addEventListener('DOMContentLoaded', function () {
  socket.emit('join', { selectedUserId: user_id }); // to join the users when the chat page is loaded

  fetch('/get_unread_count', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  })
    .then((response) => response.json())
    .then((data) => {
      messageCounter = data;

      for (id in messageCounter) {
        receivedCount = document.getElementById(id);
        receivedCount.innerText = messageCounter[id];

        // to display none when the two users are in same chat
        if (messageCounter[id] === 0) {
          receivedCount.style.display = 'none';
        } else {
          receivedCount.style.display = 'block';
        }
      }

      // console.log('response', data);
      // for (const [user_id, unread_count] of Object.entries(data)) {
      // updateCounter(user_id, unread_count);
      // }
      // console.log('unread counter', messageCounter);
    });
});

// selecting the users
function selectUsers(user_id) {
  selectedUserId = user_id;

  // socket.emit('join', { selectedUserId: user_id });

  document.getElementById('selected-user').innerHTML = document.getElementById(
    'users' + user_id
  ).innerHTML;

  clearChat();
  fetchMessages();
  updateMessage();

  document.getElementById('message-form').style.display = 'block';
}

// functionality for marking unread messages as read
function updateMessage() {
  if ((selectedUserId, user_id)) {
    fetch('/get_message_read', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        selectedUserId: selectedUserId,
        messageCounter: messageCounter,
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        // console.log('Updated message counters:', data);
        messageCounter = data;

        for (id in messageCounter) {
          document.getElementById(id).innerText = messageCounter[id];
        }
      });
  }
}

function sendMessage() {
  let messageInput = document.getElementById('messageInput');
  let message = messageInput.value;
  let currentTime = new Date().toLocaleString();

  // console.log(`Message send..., ${message}, user_id:${user_id}, selectedUserId:${selectedUserId}`);

  if (message != '') {
    socket.send({
      selectedUserId: selectedUserId,
      message: message,
      time: currentTime,
      is_read: false,
    });
  }
  messageInput.value = '';
}

function fetchMessages() {
  if (selectedUserId) {
    var messagesContainer = document.getElementById('messages-container');
    if (messagesContainer) {
      fetch(`/get_messages/${selectedUserId}`) // fetching the messages from backend with selectedUserId
        .then((response) => response.json())
        .then((data) => {
          clearChat(); // clear the message container
          // console.log(data, 'this is message data');
          data.forEach((message) => {
            displayMessages(message);
          });
        });
    }
    document.getElementById('message-form').style.display = 'block';
  } else {
    document.getElementById('message-form').style.display = 'none';
  }
}

function displayMessages(data) {
  const messagesContainer = document.getElementById('messages-container');
  let currentTime = new Date().toLocaleString();
  // console.log('display data', data);

  if (
    messagesContainer &&
    ((data.sender == user_id && data.receiver == selectedUserId) ||
      (data.sender == selectedUserId && data.receiver == user_id))
  ) {
    let messageDiv = document.createElement('div');

    const isCurrentUser = data.sender == user_id;

    messageDiv.innerHTML = `
      <div class="d-flex flex-row ${
        isCurrentUser ? 'justify-content-end' : 'justify-content-start'
      }">
        <div class="rounded-3 p-2 mb-3 ${
          isCurrentUser ? 'ms-auto' : 'me-auto'
        }" style="background-color: ${isCurrentUser ? '#dcf8c6' : '#f5f6f7'}">
          <p class="h5">${data.message}</p>
          <code class="small text-muted">${currentTime}</code>
        </div>
      </div>
    `;
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }
}

function clearChat() {
  document.getElementById('messages-container').innerHTML = '';
}

////////////////
// old
///////////////
// function fetchCounts() {
//   fetch('/get_unread_count')
//     .then((response) => response.json())
//     .then((data) => {
//       console.log('fetch user id', data.user_id);

//       // Assuming data is an array of objects with user_id and messageCounter properties
//       updateCounter(data.user_id, data.messageCounter);
//     })
//     .catch((error) => {
//       console.error('Error fetching data:', error);
//     });
// }

/////
///

// function updateCounter(user_id, messageCounter) {
//   console.log('user id -updateCounter:', user_id);
//   console.log('counter -updateCounter:', messageCounter);
//   var userRow = document.getElementById('users' + user_id);

//   if (userRow) {
//     var unreadCountElement = userRow.querySelector('.unread-messages-count');

//     if (unreadCountElement) {
//       unreadCountElement.textContent = messageCounter;
//       unreadCountElement.style.display =
//         messageCounter > 0 ? 'inline-block' : 'none';
//     }
//   }
// }

/////

// function updateMessage() {
//   fetch('/get_message_read', {
//     method: 'POST',
//     headers: {
//       'Content-Type': 'application/json',
//     },
//     body: JSON.stringify({
//       sender: selectedUserId,
//       message_counter: messageCounter,
//     }),
//   }).then;
//   (response) =>
//     response.json().then((data) => {
//       console.log('dataaaaaaa----------messages read', data);
//       messageCounter = data;
//       for (const [user_id, unread_count] of Object.entries(data)) {
//         updateCounter(user_id, unread_count);
//       }
//     });
// }

// function displayMessages(data) {
//   const messagesContainer = document.getElementById('messages-container');
//   let currentTime = new Date().toLocaleString();

//   console.log('user id.', user_id);
//   console.log('selected_user_id...../', selectedUserId);
//   console.log('data received....../', data.message);
//   // console.log('msg', message);
//   if (messagesContainer) {
//     let messageDiv = document.createElement('div');

//     messageDiv.innerHTML = `
//       <div class="d-flex flex-row ${
//         data.sender === user_id
//           ? 'justify-content-end'
//           : 'justify-content-start'
//       }">
//         <div class="rounded-3 p-2 mb-3 ${
//           data.sender === user_id ? 'ms-auto' : 'me-auto'
//         }" style="background-color: ${
//       data.sender === user_id ? '#dcf8c6' : '#f5f6f7'
//     }">
//           <p class="h5">${data.message}</p>
//           <code class="small text-muted">${currentTime}</code>
//         </div>
//       </div>
//     `;
//     messagesContainer.appendChild(messageDiv);
//     messageDiv.scrollTop = messageDiv.scrollHeight;
//   }
// }

////

// function fetchMessages(selectedUserId) {
//   fetch(`/get_messages/${selectedUserId}`)
//     .then((response) => {
//       if (!response.ok) {
//         throw new Error('Network response was not ok.');
//       }
//       return response.json();
//     })
//     .then((data) => {
//       // console.log('Received data:', data); // Log the received data to the console
//       displayMessages(data);
//     })
//     .catch((error) => {
//       console.error('Error fetching messages:', error);
//     });
// }

/////////////////////////////////////////////////////////////////////////////////////////////////////////
// // function displayMessages(messages) {
// //   const messagesContainer = document.getElementById('messages-container');
// //   messagesContainer.innerHTML = ''; // Clear previous messages
// //   // print messages
// //   // console.log(messages, 'this is single kessageuuuuuu');

// //   // for (let key of messages) {
// //   //   console.log(key);
// //   // }

// //   messages.forEach((message) => {
// //     let messageDiv = document.createElement('div');
// //     let innerDiv = document.createElement('div');
// //     let messageContent = document.createElement('p');
// //     let messageTime = document.createElement('code');

// //     messageDiv.classList.add('d-flex', 'flex-row');
// //     innerDiv.classList.add('rounded-3', 'p-2', 'mb-3');
// //     messageContent.classList.add('h5');
// //     messageTime.classList.add('small', 'text-muted');
// //     // console.log(message.message, 'hehehehh');
// //     // data
// //     messageContent.textContent = `${message.message}`;
// //     messageTime.textContent = `${message.time}`;

// //     if (message.sender === user_id) {
// //       messageDiv.classList.add('justify-content-end');
// //       innerDiv.style.backgroundColor = '#dcf8c6'; // Sender's message color
// //       innerDiv.classList.add('ms-auto'); // Align to right
// //     } else {
// //       messageDiv.classList.add('justify-content-start');
// //       innerDiv.style.backgroundColor = '#f5f6f7'; // Receiver's message color
// //       innerDiv.classList.add('me-auto'); // Align to left
// //     }

// //     innerDiv.appendChild(messageContent);
// //     innerDiv.appendChild(messageTime);
// //     messageDiv.appendChild(innerDiv);
// //     messagesContainer.appendChild(messageDiv);
// //   });
// // }
// /////////////////////////////////////////////////////////////////////////////////////////////////////////
// // function displayMessages(messages) {
// //   const messagesContainer = document.getElementById('messages-container');
// //   messagesContainer.innerHTML = ''; // Clear previous messages

// //   messages.forEach((message) => {
// //     const messageDiv = document.createElement('div');
// //     messageDiv.classList.add('d-flex', 'flex-row', 'justify-content-start');

// //     const innerDiv = document.createElement('div');

// //     const messageContent = document.createElement('p');
// //     messageContent.classList.add('small', 'p-2', 'ms-3', 'mb-1', 'rounded-3');
// //     messageContent.style.backgroundColor = '#f5f6f7';
// //     messageContent.textContent = `${message.message}`;

// //     const messageTime = document.createElement('p');
// //     messageTime.classList.add(
// //       'small',
// //       'ms-3',
// //       'mb-3',
// //       'rounded-3',
// //       'text-muted',
// //       'float-end'
// //     );
// //     messageTime.textContent = `${message.time}`;

// //     innerDiv.appendChild(messageContent);
// //     innerDiv.appendChild(messageTime);

// //     messageDiv.appendChild(innerDiv);
// //     messagesContainer.appendChild(messageDiv);
// //   });
// // }

// // Rest of your displayMessages function remains the same
// // Ensure the structure of 'messages' is as expected for display
// //..............................................................................................................................................
// // function fetchMessages(selectedUserId) {
// //   fetch(`/get_messages/${selectedUserId}`)
// //     .then((response) => {
// //       if (!response.ok) {
// //         throw new Error('Network response was not ok.');
// //       }
// //       return response.json();
// //     })
// //     .then((data) => {
// //       displayMessages(data);
// //     })
// //     .catch((error) => {
// //       console.error('Error fetching messages:', error);
// //     });
// // }

// // function displayMessages(messages) {
// //   const messagesContainer = document.getElementById('messages-container');
// //   messagesContainer.innerHTML = ''; // Clear previous messages

// //   messages.forEach((message) => {
// //     const messageDiv = document.createElement('div');
// //     messageDiv.classList.add('message');
// //     messageDiv.textContent = `${message.content} - Sender: ${message.sender} - Time: ${message.time}`;
// //     messagesContainer.appendChild(messageDiv);
// //   });
// // }
// //.............................................................................................................................................
// // function displayMessages(messages) {
// //   const messagesContainer = document.getElementById('messages-container');
// //   messagesContainer.innerHTML = ''; // Clear previous messages

// //   messages.forEach((message) => {
// //     // Display each message in the chat interface
// //     messagesContainer.innerHTML += `<div class="message">${message.content} - Sender: ${message.sender} - Time: ${message.time}</div>`;
// //   });
// // }

// // function fetchMessages(selectedUserId) {
// // fetch(`/get_messages/${selectedUserId}`)
// // .then((response) => response.json())
// // .then((messages) => {
// // const messagesContainer = document.getElementById('messages-container');
// // messagesContainer.innerHTML = ''; // Clear previous messages
// //
// // messages.forEach((message) => {
// //  Display each message in the chat interface
// // messagesContainer.innerHTML += `<div>${message.content} - Sender: ${message.sender} - Time: ${message.time}</div>`;
// // });
// // console.log(`${message.content}<br>`);
// // })
// // .catch((error) => {
// // console.error('Error fetching messages:', error);
// // });
// // }
// //
// // function loadPreviousMessages() {
// // if (selectedUserId) {
// // var chatContainer = document.getElementById('chat-message-container');
// // if (chatContainer) {
// //  Clear the chat container before loading previous messages
// // clearChatContainer();
// //
// // fetch(`/get_messages/${selectedUserId}`)
// // .then((response) => response.json())
// // .then((data) => {
// // data.forEach((message) => {
// // appendMessageToChat(
// // message,
// // message.sender === userId ? 'my-message' : 'other-message',
// // true
// // );
// // });
// // })
// // .catch((error) => console.error('Error fetching messages:', error));
// // }
// // document.getElementById('message-form').style.display = 'block';
// // } else {
// // document.getElementById('message-form').style.display = 'none';
// // }
// // }
// //
// // function clearChatContainer() {
// // var chatContainer = document.getElementById('chat-message-container');
// // if (chatContainer) {
// // chatContainer.innerHTML = '';
// // }
// // }
// //
// // function fetchMessages(selectedUserId) {
// //   let messagesContainer = document.getElementById('messages-container');

// //   fetch(`/get_messages/${selectedUserId}`)
// //     .then((response) => response.json())
// //     .then((messages) => {
// //       // Handle received messages
// //       messages.forEach((message) => {
// //         // Display each message in the chat interface
// //         messagesContainer.innerHTML += `<div>${message.content} - Sender: ${message.sender} - Time: ${message.time}</div>`;
// //       });
// //     })
// //     .catch((error) => {
// //       console.error('Error fetching messages:', error);
// //     });
// //}
