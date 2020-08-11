const Web3 = require('web3');
const web3 = new Web3('http://localhost:8545');
const ctContract = require('../contract/tracerCT.json');
const tracerContract = require('../contract/tokenTracer.json');
let ctAddress = "0x9c34c562aaFc7dC5782E533314DB4a6Bb39e090c";
let relayer = "0x49179Ab162fF799EBa1E143D27D11db95C3805F3";
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
