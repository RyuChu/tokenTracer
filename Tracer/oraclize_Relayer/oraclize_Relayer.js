const Web3 = require('web3');
const web3 = new Web3('http://localhost:8545');
const ctContract = require('../contract/tracerCT.json');
const tracerContract = require('../contract/tokenTracer.json');
let ctAddress = "0x055b0b9cD31b954FBDD9054e649B10E88399f160";
let relayer = "0x1aCAF568628d2ce875d19008f969578bd097a28D";
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
