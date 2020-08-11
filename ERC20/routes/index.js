const express = require('express');
const router = express.Router();

const Web3 = require('web3');

const web3 = new Web3('http://localhost:7545');

const contract = require('../contract/Bank.json');

/* GET home page. */
router.get('/', async function (req, res, next) {
  res.render('index')
});

//get accounts
router.get('/accounts', async function (req, res, next) {
  let accounts = await web3.eth.getAccounts()
  res.send(accounts)
});

//login
router.get('/balance', async function (req, res, next) {
  let ethBalance = await web3.eth.getBalance(req.query.account)
  res.send({
    ethBalance: web3.utils.fromWei(ethBalance, 'ether')
  })
});

//balance
router.get('/allBalance', async function (req, res, next) {
  let bank = new web3.eth.Contract(contract.abi);
  bank.options.address = req.query.address;
  let ethBalance = await web3.eth.getBalance(req.query.account)
  // let bankBalance = await bank.methods.getBankBalance().call({ from: req.query.account })
  let coinBalance = await bank.methods.balanceOf(req.query.account).call({ from: req.query.account })
  res.send({
    ethBalance: web3.utils.fromWei(ethBalance, 'ether'),
    // bankBalance: web3.utils.fromWei(bankBalance, 'ether'),
    coinBalance: coinBalance
  })
});

//contract
router.get('/contract', function (req, res, next) {
  let bank = new web3.eth.Contract(contract.abi);
  bank.options.address = req.query.address;
  res.send({
    bank: bank
  })
});

//unlock account
router.post('/unlock', function (req, res, next) {
  web3.eth.personal.unlockAccount(req.body.account, req.body.password, 60)
    .then(function (result) {
      res.send('true')
    })
    .catch(function (err) {
      res.send('false')
    })
});

//deploy bank contract
router.post('/deploy', function (req, res, next) {
  let bank = new web3.eth.Contract(contract.abi);
  bank.deploy({
    data: contract.bytecode
  })
    .send({
      from: req.body.account,
      gas: 3400000
    })
    .on('receipt', function (receipt) {
      res.send(receipt);
    })
    .on('error', function (error) {
      res.send(error.toString());
    })
});

//owner
router.get('/owner', async function (req, res, next) {
  let bank = new web3.eth.Contract(contract.abi);
  bank.options.address = req.query.address;
  let owner = await bank.methods.getOwner().call({ from: req.query.account });
  res.send({owner: owner});
});

//mint Coin
// router.post('/mintCoin', function (req, res, next) {
//   let bank = new web3.eth.Contract(contract.abi);
//   bank.options.address = req.body.address;
//   bank.methods.mint(req.body.value).send({
//     from: req.body.account,
//     gas: 3400000
//   })
//     .on('receipt', function (receipt) {
//       res.send(receipt);
//     })
//     .on('error', function (error) {
//       res.send(error.toString());
//     })
// });

//buy Coin
// router.post('/buyCoin', function (req, res, next) {
//   let bank = new web3.eth.Contract(contract.abi);
//   bank.options.address = req.body.address;
//   bank.methods.buy(req.body.value).send({
//     from: req.body.account,
//     gas: 3400000
//   })
//     .on('receipt', function (receipt) {
//       res.send(receipt);
//     })
//     .on('error', function (error) {
//       res.send(error.toString());
//     })
// });

//approve
router.post('/approve', function (req, res, next) {
  let bank = new web3.eth.Contract(contract.abi);
  bank.options.address = req.body.address;
  bank.methods.approve(req.body.to, req.body.value).send({
    from: req.body.account,
    gas: 3400000
  })
    .on('receipt', function (receipt) {
      res.send(receipt);
    })
    .on('error', function (error) {
      res.send(error.toString());
    })
});

//transfer Coin
router.post('/transfer', function (req, res, next) {
  let bank = new web3.eth.Contract(contract.abi);
  bank.options.address = req.body.address;
  bank.methods.transfer(req.body.to, req.body.value).send({
    from: req.body.account,
    gas: 3400000
  })
    .on('receipt', function (receipt) {
      res.send(receipt);
    })
    .on('error', function (error) {
      res.send(error.toString());
    })
});

//transfer Owner
router.post('/transferOwner', function (req, res, next) {
  let bank = new web3.eth.Contract(contract.abi);
  bank.options.address = req.body.address;
  bank.methods.transferOwnership(req.body.to).send({
    from: req.body.account,
    gas: 3400000
  })
    .on('receipt', function (receipt) {
      res.send(receipt);
    })
    .on('error', function (error) {
      res.send(error.toString());
    })
});

module.exports = router;
