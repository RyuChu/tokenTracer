const Web3 = require('web3');
const web3 = new Web3('http://localhost:8545');
const ctContract = require('../contract/tracerCT.json');
const tracerContract = require('../contract/tokenTracer.json');
let ctAddress = "0x08f975064f16dFcEd1420B72f2DB257328B51a5f";
let relayer = "0xE905183465AD9894c565Bc3967384Aa2EB38FC75";
main();
async function main() {
    setInterval(async function() {
        let ct = new web3.eth.Contract(ctContract.abi);
        ct.options.address = ctAddress;
        let token = await ct.methods.getTokenContract().call({
            from: relayer
        });
        for (var i = 0; i < token.length; i++) {
            let tracer = await ct.methods.tokenTracers(token[i]).call({ from: relayer });
            let tr = new web3.eth.Contract(tracerContract.abi);
            tr.options.address = tracer;
            let oraclizeIsRunning = await tr.methods.oraclizeIsRunning().call({ from: relayer });
            if (!oraclizeIsRunning) {
                tr.methods.traceTx().send({
                    from: relayer,
                    value: web3.utils.toWei("11", "ether")
                }).on('receipt', async function(receipt) {
                    console.log('Trace token transaction history - Tracer: ' + tracer);
                }).on('error', function(error) {
                    console.log(error);
                })
            }

            tr.methods.updateBlockHeight().send({
                from: relayer,
                value: web3.utils.toWei("0.3", "ether")
            }).on('receipt', async function(receipt) {
                console.log('Update current block height - Tracer: ' + tracer);
            }).on('error', function(error) {
                console.log(error);
            })
        }
    }, 20000)
}