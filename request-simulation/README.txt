ReadMe

firebase references:
  /sessions/<sid>  -> presence monitoring of teachers

  /channels/<username> -> live private messaging channel for all users (access only new messages). Messages sent by server.

  /requests/<req id> -> endpoint where teachers will push their responses to a particular student request

  /teaching/<req id> -> endpoint for all the communication of current teaching session between student and teacher


1) Presence monitoring of teachers:
  /sessions/<sid>
  <sid> is the session token that teachers receive on logging into the account

  Teachers will monitor their connection with firebase (by listening to /.info/connnected endpoint) and notify the presence endpoint. Message structure will be
  {
    ts : <sessionStartTime>,
    username : <username>, 
    device : <device name>, 
    online : <boolean>, //set to true on connect, false on disconnection event 
    processed : false //always set to false, used by our always-on 'presence server' to filter and process all unseen presence related events
  }

  Note that : onDisconnect() event to indicate offline must set the same timestamp('ts') as used when setting the online message.

2) Private messaging channel
  /channes/<username>
  All the users will listen to this channel for 'control' messages like:
  teacher will receive session 'request' message when server finds him eligible for student request and sends him the message.

  teacher will receive 'deny' or 'assign' message when he is rejected or selected for a particular teaching session

  Student will receive 'deny' message if no teacher has accepted his request and 'assign' message when a particular teacher is assigned the job for his request with teacher details

3) Teacher response channel for teaching requests
  /requests/<req id>
  Here teacher will respond to a 'request' message received on their private channel with either 'accept' or 'reject' messages e.g
    {
      action : "accept",
      username : "ashish"
    }
    {
      action : "reject",
      username : "ashish"
    }

4) Live Teaching Communication : e.g whiteboard, chat, presence and so on
  /teaching/<req id>

  /teaching/<req id>/whiteboard for whiteboard events
  /teaching/<req id>/presence for presence events to know whether other guy is online/offline and freeze whiteboard accordingly
  /teaching/<req id>/chat for chat messages (if we ever do that)
