 // contract test code will go here
const assert = require("assert");
const ganache = require("ganache-cli");
const Web3 = require("web3");
const web3 = new Web3(ganache.provider());
const { interface, bytecode } = require('../compile');

//declare accounts to get information of test accounts that ganache test network created for us
let accounts;
//declare contract instance for logging purpose
let inbox;

beforeEach(async () => {
    // Get a list of all accounts
    accounts = await web3.eth.getAccounts();

    //Get one of the accounts to deploy contract
    lottery = await new web3.eth.Contract(JSON.parse(interface))
    .deploy({
      data: bytecode
    })
    .send({ from: accounts[0], gas: '1000000' });
});

describe('Lottery Contract', () => {
    it('deploys a contract', () => {
        assert.ok(lottery.options.address);
    });

    it("allows one account to enter", async () => {
        await lottery.methods.enter().send({
            from: accounts[0],
            value: web3.utils.toWei('0.02', 'ether')
        });

        const players =  await lottery.methods.getPlayers().call({
            //specify who is calling this function
            from: accounts[0]
        });

        assert.equal(accounts[0], players[0]);
        assert.equal(1, players.length);
    });

    it("require minimum eth to enter", async () => {
        try{
            await lottery.methods.enter().send({ 
                from: accounts[0],
                value: 0
            });
            assert(fail);
        }
        catch(err){
            assert(err);
        }
    });

    it("only manager can call pickWinner", async () => {
        try{
            await lottery.methods.pickWinner().send({ 
                from: accounts[1]
            });
            assert(fail);
        }
        catch(err){
            assert(err);
        }
    });

    it("sends money to the winner and reset the players array", async () => {
        await lottery.methods.enter().send({
            from: accounts[0],
            value: web3.utils.toWei('2', 'ether')
        });

        const initialBalance = await web3.eth.getBalance(accounts[0]);
        await lottery.methods.pickWinner().send({
            from: accounts[0]
        });
        const afterBalance = await web3.eth.getBalance(accounts[0]);
        const difference = afterBalance - initialBalance;

        assert(difference > web3.utils.toWei('1.8', 'ether'));
    });
});