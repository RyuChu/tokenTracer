'use strict'

let contractAddress = $('#contractAddress');
let deployedContractAddressInput = $('#deployedContractAddressInput');
let loadDeployedContractButton = $('#loadDeployedContractButton');
let deployNewContractButton = $('#deployNewContractButton');

let whoami = $('#whoami');
let whoamiButton = $('#whoamiButton');
let copyButton = $('#copyButton');

let update = $('#update');

let logger = $('#logger');

let checkOwner = $('#checkOwner')
let checkOwnerButton = $('#checkOwnerButton')
// let mintValue = $('#mintValue')
// let mintButton = $('#mintButton')
// let buyCoinValue = $('#buyCoinValue')
// let buyCoinButton = $('#buyCoinButton')
let approveTo = $('approveTo')
let approveValue = $('approveValue')
let approveButton = $('approveButton')
let transferTo = $('#transferTo')
let transferValue = $('#transferValue')
let transferButton = $('#transferButton')
let transferOwnerTo = $('#transferOwnerTo')
let transferOwnerButton = $('#transferOwnerButton')

let bankAddress = "";
let nowAccount = "";

function log(...inputs) {
	for (let input of inputs) {
		if (typeof input === 'object') {
			input = JSON.stringify(input, null, 2)
		}
		logger.html(input + '\n' + logger.html())
	}
}

// 載入使用者至 select tag
$.get('/accounts', function (accounts) {
	for (let account of accounts) {
		whoami.append(`<option value="${account}">${account}</option>`)
	}
	nowAccount = whoami.val();

	update.trigger('click')

	log(accounts, '以太帳戶')
})

// 當按下載入既有合約位址時
loadDeployedContractButton.on('click', function () {
	loadBank(deployedContractAddressInput.val())
})

// 當按下部署合約時
deployNewContractButton.on('click', function () {
	newBank()
})

// 當按下登入按鍵時
whoamiButton.on('click', async function () {

	nowAccount = whoami.val();

	update.trigger('click')

})

// 當按下複製按鍵時
copyButton.on('click', function () {
	let textarea = $('<textarea />')
	textarea.val(whoami.val()).css({
		width: '0px',
		height: '0px',
		border: 'none',
		visibility: 'none'
	}).prependTo('body')

	textarea.focus().select()

	try {
		if (document.execCommand('copy')) {
			textarea.remove()
			return true
		}
	} catch (e) {
		console.log(e)
	}
	textarea.remove()
	return false
})

// 當按下更新按鍵時
update.on('click', function () {
	if (bankAddress != "") {
		$.get('/allBalance', {
			address: bankAddress,
			account: nowAccount
		}, function (result) {
			log({
				address: nowAccount,
				ethBalance: result.ethBalance,
				// bankBalance: result.bankBalance,
				coinBalance: result.coinBalance
			})
			log('更新帳戶資料')

			$('#ethBalance').text('以太帳戶餘額 (ETH): ' + result.ethBalance)
			// $('#bankBalance').text('銀行ETH餘額 (ETH): ' + result.bankBalance)
			$('#coinBalance').text('銀行ETH餘額 (COIN): ' + result.coinBalance)
		})
	}
	else {
		$.get('/balance', {
			account: nowAccount
		}, function (result) {
			$('#ethBalance').text('以太帳戶餘額 (ETH): ' + result.ethBalance)
			// $('#bankBalance').text('銀行ETH餘額 (ETH): ')
			$('#coinBalance').text('銀行ETH餘額 (COIN): ' + result.coinBalance)
		})
	}
})

// 載入bank合約
function loadBank(address) {
	if (!(address === undefined || address === null || address === '')) {
		$.get('/contract', {
			address: address
		}, function (result) {
			if (result.bank != undefined) {
				bankAddress = address;

				contractAddress.text('合約位址:' + address)
				log(result.bank, '載入合約')

				update.trigger('click')
			}
			else {
				log(address, '載入失敗')
			}
		})
	}
}

// 新增bank合約
async function newBank() {

	// 解鎖
	let unlock = await unlockAccount();
	if (!unlock) {
		return;
	}

	// 更新介面
	waitTransactionStatus()

	$.post('/deploy', {
		account: nowAccount
	}, function (result) {
		if (result.contractAddress) {
			log(result, '部署合約')

			// 更新合約介面
			bankAddress = result.contractAddress
			contractAddress.text('合約位址:' + result.contractAddress)
			deployedContractAddressInput.val(result.contractAddress)

			update.trigger('click');

			// 更新介面
			doneTransactionStatus();
		}
	})
}

function waitTransactionStatus() {
	$('#accountStatus').html('帳戶狀態 <b style="color: blue">(等待交易驗證中...)</b>')
}

function doneTransactionStatus() {
	$('#accountStatus').text('帳戶狀態')
}


async function unlockAccount() {
	let password = prompt("請輸入你的密碼", "");
	if (password == null) {
		return false;
	}
	else {
		return $.post('/unlock', {
			account: nowAccount,
			password: password
		})
			.then(function (result) {
				if (result == 'true') {
					return true;
				}
				else {
					alert("密碼錯誤")
					return false;
				}
			})
	}
}

checkOwnerButton.on('click', async function(){
	if (bankAddress != "") {
		$.get('/owner', {
			address: bankAddress,
			account: nowAccount
		}, function (result) {
			log({
				address: nowAccount,
				owner: result.owner
			})
			log('取得Owner資訊')

			$('#checkOwner').text('Owner帳戶: ' + result.owner)
		})
	}
})

// mintButton.on('click', async function(){
// 	if (bankAddress == "") {
// 		return;
// 	}

// 	// 解鎖
// 	let unlock = await unlockAccount();
// 	if (!unlock) {
// 		return;
// 	}

// 	// 更新介面
// 	waitTransactionStatus()

// 	$.post('/mintCoin', {
// 		address: bankAddress,
// 		account: nowAccount,
// 		value: mintValue.val()
// 	}, function (result) {
// 		if (result.events !== undefined) {
// 			log(result.events.MintEvent.returnValues, '鑄幣成功')

// 			// 觸發更新帳戶資料
// 			update.trigger('click')

// 			// 更新介面 
// 			doneTransactionStatus()
// 		}
// 		else {
// 			log(result)
// 			// 更新介面 
// 			doneTransactionStatus()
// 		}
// 	})
// })

// buyCoinButton.on('click', async function () {
// 	if (bankAddress == "") {
// 		return;
// 	}

// 	// 解鎖
// 	let unlock = await unlockAccount();
// 	if (!unlock) {
// 		return;
// 	}

// 	// 更新介面
// 	waitTransactionStatus()

// 	$.post('/buyCoin', {
// 		address: bankAddress,
// 		account: nowAccount,
// 		value: buyCoinValue.val()
// 	}, function (result) {
// 		if (result.events !== undefined) {
// 			log(result.events.BuyCoinEvent.returnValues, '購買Coin成功')

// 			// 觸發更新帳戶資料
// 			update.trigger('click')

// 			// 更新介面 
// 			doneTransactionStatus()
// 		}
// 		else {
// 			log(result)
// 			// 更新介面 
// 			doneTransactionStatus()
// 		}
// 	})
// })

approveButton.on('click', async function () {
	if (bankAddress == "") {
		return;
	}

	// 解鎖
	let unlock = await unlockAccount();
	if (!unlock) {
		return;
	}

	// 更新介面
	waitTransactionStatus()

	$.post('/approve', {
		address: bankAddress,
		account: nowAccount,
		to: approveTo.val(),
		value: approveValue.val()
	}, function (result) {
		if (result.events !== undefined) {
			log(result.events.Approval.returnValues, 'Approve成功')

			// 觸發更新帳戶資料
			update.trigger('click')

			// 更新介面 
			doneTransactionStatus()
		}
		else {
			log(result)
			// 更新介面 
			doneTransactionStatus()
		}
	})
})

transferButton.on('click', async function () {
	if (bankAddress == "") {
		return;
	}

	// 解鎖
	let unlock = await unlockAccount();
	if (!unlock) {
		return;
	}

	// 更新介面
	waitTransactionStatus()

	$.post('/transfer', {
		address: bankAddress,
		account: nowAccount,
		to: transferTo.val(),
		value: transferValue.val()
	}, function (result) {
		if (result.events !== undefined) {
			log(result.events.Transfer.returnValues, '移轉Coin成功')

			// 觸發更新帳戶資料
			update.trigger('click')

			// 更新介面 
			doneTransactionStatus()
		}
		else {
			log(result)
			// 更新介面 
			doneTransactionStatus()
		}
	})
})

transferOwnerButton.on('click', async function () {
	if (bankAddress == "") {
		return;
	}

	// 解鎖
	let unlock = await unlockAccount();
	if (!unlock) {
		return;
	}

	// 更新介面
	waitTransactionStatus()

	$.post('/transferOwner', {
		address: bankAddress,
		account: nowAccount,
		to: transferOwnerTo.val()
	}, function (result) {
		if (result.events !== undefined) {
			log('轉移Owner成功')

			// 觸發更新資料
			checkOwnerButton.trigger('click')

			// 更新介面 
			doneTransactionStatus()
		}
		else {
			log(result)
			// 更新介面 
			doneTransactionStatus()
		}
	})
})
