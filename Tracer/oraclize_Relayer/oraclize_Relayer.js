const Web3 = require('web3');
const web3 = new Web3('http://localhost:8545');
const ctContract = require('../contract/tracerCT.json');
const tracerContract = require('../contract/tokenTracer.json');
let ctAddress = "0x4D0337e0B0FD27b2D77fc661ee660ea80d140729";
let relayer = "0xbe19cd17328F77c8247f177869Fea0746A89E809";
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
					value: web3.utils.toWei("7", "ether")
				}).on('receipt', async function(receipt) {
					console.log('Trace for token history - Tracer: ' + tracer);
				}).on('error', function(error) {
					console.log(error);
				})
			}
		}
	}, 30000)
}
