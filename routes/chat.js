const express = require('express');
const vcap = require('../util/vcapService');
const router = express.Router();
const watson = require('watson-developer-cloud');

router.get('/', (req, res) => {
    res.sendFile('views/chat.html',{root: __dirname.replace('/routes','')});
});

router.post('/mensagem', (req, res) => {
    let watsonConfig = vcap.conversation[0].credentials;
    watsonConfig.version = 'v1';
    watsonConfig.version_date = '2018-02-16';

    const conversation = watson.conversation( watsonConfig );

    conversation.message({
        workspace_id: '3052bcdf-3bc1-4aa9-b929-9e50c4fbf096',
        input: { 'text': req.body.mensagem },
        context: JSON.parse(req.body.context)
    }, function (err, response) {
        if (err) {
            console.error(err);
            res.send(err);
        }
        else {
            res.send(response);
            //insertConversationRecord(response.input.text[0],response.intents[0]);
            //console.log(response)

        }
    });

});

// function insertConversationRecord(input, confidence){
//   router.post('/api/insertConversationRecord', (req, res) => {
//       "{
//           input: input,
//           confidence: confidence
//       }"
//     },
//       function (response) {
//
//       }
//   );
// }

module.exports = router;
