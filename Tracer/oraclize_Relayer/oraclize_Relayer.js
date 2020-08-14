const Web3 = require('web3');
const web3 = new Web3('http://localhost:8545');
const ctContract = require('../contract/tracerCT.json');
const tracerContract = require('../contract/tokenTracer.json');
let ctAddress = "0x43d921CA002104424873cB50a57E19562608773b";
let relayer = "0x43086E7F4ecb9a9E66a6230D494378a2B8fD481D";
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
			let oraclizeIsDone = await tr.methods.oraclizeIsDone().call({ from: relayer });
			if (oraclizeIsDone) {
				tr.methods.traceTx().send({
					from: relayer,
					value: web3.utils.toWei("11", "ether")
				}).on('receipt', async function(receipt) {
					console.log('Relaunch tracer oraclize - ' + tracer);
				}).on('error', function(error) {
					console.log(error);
				})
			} else if (!oraclizeIsRunning) {
				tr.methods.traceTx().send({
					from: relayer,
					value: web3.utils.toWei("101", "ether")
				}).on('receipt', async function(receipt) {
					console.log('Relaunch tracer oraclize - ' + tracer);
				}).on('error', function(error) {
					console.log(error);
				})
			}
		}
	}, 30000)
}
