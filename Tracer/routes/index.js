const express = require('express');
const router = express.Router();
const Web3 = require('web3');
const web3 = new Web3('http://localhost:8545');
const ctContract = require('../contract/tracerCT.json');
const tracerContract = require('../contract/tokenTracer.json');
const ctAddress = "0x9c34c562aaFc7dC5782E533314DB4a6Bb39e090c";
const nowAccount = "0x49179Ab162fF799EBa1E143D27D11db95C3805F3";
/* GET home page. */
router.get('/', async function(req, res, next) {
    res.render('index')
});
//get accounts
router.get('/ct', function(req, res, next) {
    let address = ctAddress
    res.send(address)
});
//get reg tokens in ct
router.get('/getTokens', async function(req, res, next) {
    let ct = new web3.eth.Contract(ctContract.abi);
    ct.options.address = ctAddress;
    let tokens = await ct.methods.getTokenContract().call({
        from: nowAccount
    });
    res.send(tokens)
});
//get tracer
router.post('/getTracer', async function(req, res, next) {
    let ct = new web3.eth.Contract(ctContract.abi);
    ct.options.address = ctAddress;
    let tracer = await ct.methods.tokenTracers(req.body.tokenAddress).call({
        from: nowAccount
    });
    let tr = new web3.eth.Contract(tracerContract.abi)
    tr.options.address = tracer
    let tracerBlockHeight = await tr.methods.syncBlockHeight().call({
        from: nowAccount
    });
    let tracerTransactionCount = await tr.methods.transactionCount().call({
        from: nowAccount
    });
    let mainBlockHeight = await tr.methods.realBlockHeight().call({
        from: nowAccount
    });
    let oraclizeStatus = await tr.methods.oraclizeIsRunning().call({
        from: nowAccount
    });
    res.send({
        tracer: tracer,
        mainBlockHeight: mainBlockHeight,
        tracerBlockHeight: tracerBlockHeight,
        tracerTransactionCount: tracerTransactionCount,
        oraclizeStatus: oraclizeStatus
    });
});
//registration
router.post('/regTracer', async function(req, res, next) {
    let ct = new web3.eth.Contract(ctContract.abi);
    ct.options.address = ctAddress;
    ct.methods.regTracer(web3.utils.toChecksumAddress(req.body.tokenAddress)).send({
        from: nowAccount,
        gas: 20000000
    }).on('receipt', async function(receipt) {
        let tracer = await ct.methods.tokenTracers(req.body.tokenAddress).call({
            from: nowAccount
        });
        res.send({
            receipt: receipt,
            tracer: tracer
        });
    }).on('error', function(error) {
        res.send(error.toString());
    })
});
router.post('/searchAll', async function(req, res, next) {
    let tr = new web3.eth.Contract(tracerContract.abi);
    tr.options.address = web3.utils.toChecksumAddress(req.body.tracerAddress);
    let transactionCount = await tr.methods.transactionCount().call({
        from: nowAccount
    });
    let indexTo = 100;
    if ((transactionCount-req.body.indexFrom) < 100) {
        indexTo = transactionCount - req.body.indexFrom;
    }
    var result = await tr.methods.token_query(req.body.indexFrom, indexTo).call({
        from: nowAccount
    });
    res.send({
        transactionHash: result[0],
        sender: result[1],
        receiver: result[2],
        value: result[3],
        blockNumber: result[4],
        timeStamp: result[5]
    });
});
router.post('/searchDateUser', async function(req, res, next) {
    let tr = new web3.eth.Contract(tracerContract.abi);
    tr.options.address = web3.utils.toChecksumAddress(req.body.tracerAddress);
    var result = await tr.methods.token_queryTime(req.body.searchFromDate, req.body.searchToDate, web3.utils.toChecksumAddress(req.body.user), req.body.searchType, req.body.checkPoint).call({
        from: nowAccount
    });
    res.send({
        checkPoint: result[0],
        transactionHash: result[1],
        sender: result[2],
        receiver: result[3],
        value: result[4],
        blockNumber: result[5],
        timeStamp: result[6]
    });
});
router.post('/searchDateBoth', async function(req, res, next) {
    let tr = new web3.eth.Contract(tracerContract.abi);
    tr.options.address = web3.utils.toChecksumAddress(req.body.tracerAddress);
    var result = await tr.methods.token_queryTime(req.body.searchFromDate, req.body.searchToDate, web3.utils.toChecksumAddress(req.body.fromUser), web3.utils.toChecksumAddress(req.body.toUser)).call({
        from: nowAccount
    });
    res.send({
        transactionHash: result[0],
        sender: result[1],
        receiver: result[2],
        value: result[3],
        blockNumber: result[4],
        timeStamp: result[5]
    });
});
router.post('/searchDate', async function(req, res, next) {
    let tr = new web3.eth.Contract(tracerContract.abi);
    tr.options.address = web3.utils.toChecksumAddress(req.body.tracerAddress);
    var result = await tr.methods.token_queryTime(req.body.searchFromDate, req.body.searchToDate, req.body.checkPoint).call({
        from: nowAccount
    });
    res.send({
        checkPoint: result[0],
        transactionHash: result[1],
        sender: result[2],
        receiver: result[3],
        value: result[4],
        blockNumber: result[5],
        timeStamp: result[6]
    });
});
router.post('/searchHeightUser', async function(req, res, next) {
    let tr = new web3.eth.Contract(tracerContract.abi);
    tr.options.address = web3.utils.toChecksumAddress(req.body.tracerAddress);
    var result = await tr.methods.token_queryBlock(req.body.searchFromHeight, req.body.searchToHeight, web3.utils.toChecksumAddress(req.body.user), req.body.searchType, req.body.checkPoint).call({
        from: nowAccount
    });
    res.send({
        checkPoint: result[0],
        transactionHash: result[1],
        sender: result[2],
        receiver: result[3],
        value: result[4],
        blockNumber: result[5],
        timeStamp: result[6]
    });
});
router.post('/searchHeightBoth', async function(req, res, next) {
    let tr = new web3.eth.Contract(tracerContract.abi);
    tr.options.address = web3.utils.toChecksumAddress(req.body.tracerAddress);
    var result = await tr.methods.token_queryBlock(req.body.searchFromHeight, req.body.searchToHeight, web3.utils.toChecksumAddress(req.body.fromUser), web3.utils.toChecksumAddress(req.body.toUser)).call({
        from: nowAccount
    });
    res.send({
        transactionHash: result[0],
        sender: result[1],
        receiver: result[2],
        value: result[3],
        blockNumber: result[4],
        timeStamp: result[5]
    });
});
router.post('/searchHeight', async function(req, res, next) {
    let tr = new web3.eth.Contract(tracerContract.abi);
    tr.options.address = web3.utils.toChecksumAddress(req.body.tracerAddress);
    var result = await tr.methods.token_queryBlock(req.body.searchFromHeight, req.body.searchToHeight, req.body.checkPoint).call({
        from: nowAccount
    });
    res.send({
        checkPoint: result[0],
        transactionHash: result[1],
        sender: result[2],
        receiver: result[3],
        value: result[4],
        blockNumber: result[5],
        timeStamp: result[6]
    });
});
module.exports = router;
