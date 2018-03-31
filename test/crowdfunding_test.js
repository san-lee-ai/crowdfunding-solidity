var Crowdfunding = artifacts.require("./Crowdfunding.sol");

contract('Crowdfunding', function(accounts) {
  var firstCreator = accounts[1];
  var secondCreator = accounts[2];
  var firstFunder = accounts[3];
  var secondFunder = accounts[4];

  var firstFundingGoal = web3.toWei(10, "ether");
  var secondFundingGoaa = web3.toWei(5, "ether");

  var fundAmountForFirst = web3.toWei(20, "ether");
  var fundAmountForSecond =  web3.toWei(15, "ether");
  var pledgedFunding = web3.toWei(35, "ether");

  var fundedBefore, fundedAfter;
  var closedBefore, closedAfter;

  var now = new Date().getTime();
  var aWeek = (3600 * 24 * 7);

  now = parseInt(now / 1000);

  it("should create first campaign", function() {
    return Crowdfunding.deployed().then(function(instance) {
      return instance.createCampaign(
        firstFundingGoal,
        {from: firstCreator}
      );
    }).then(function(receipt) {
      assert.equal(receipt.logs.length, 1, "one event should have been triggered");
      assert.equal(receipt.logs[0].event, "GenerateCampaign", "event should be GenerateCampaign");
      assert.equal(receipt.logs[0].args._id, 0, "campaign id must be 0");
      assert.equal(receipt.logs[0].args._creator, firstCreator, "campaign creator must be " + firstCreator);
      assert.equal(receipt.logs[0].args._fundingGoal.toNumber(), firstFundingGoal, "funding goal must be " + firstFundingGoal);
      assert.equal(receipt.logs[0].args._pledgedFund, 0, "pledged fund must be " + 0);
      assert.equal(receipt.logs[0].args._deadline.toNumber() - now - aWeek < 3600, true, "deadline must be less then error range a day");
    });
  });

  it("should create second campaign", function() {
    return Crowdfunding.deployed().then(function(instance) {
      return instance.createCampaign(
        secondFundingGoaa,
        {from: secondCreator}
      );
    }).then(function(receipt) {
      assert.equal(receipt.logs.length, 1, "one event should have been triggered");
      assert.equal(receipt.logs[0].event, "GenerateCampaign", "event should be GenerateCampaign");
      assert.equal(receipt.logs[0].args._id, 1, "campaign id must be 1");
      assert.equal(receipt.logs[0].args._creator, secondCreator, "campaign creator must be " + secondCreator);
      assert.equal(receipt.logs[0].args._fundingGoal.toNumber(), secondFundingGoaa, "funding goal must be " + secondFundingGoaa);
      assert.equal(receipt.logs[0].args._pledgedFund, 0, "pledged fund must be " + 0);
      assert.equal(receipt.logs[0].args._deadline.toNumber() - now - aWeek < 3600, true, "campaign deadline must be less then error range a day");
    });
  });

  it("should be getting deadline", function() {
    return Crowdfunding.deployed().then(function(instance) {
      return instance.getDeadline(now);
    }).then(function(data) {
      var nextWeek = new Date();
      nextWeek.setTime(data * 1000);

      assert.equal(data - now, aWeek, "week must be " + aWeek + " seconds");
    });
  });

  it("should be first funding a campaign", function() {
    return Crowdfunding.deployed().then(function(instance) {
      fundedBefore = web3.fromWei(web3.eth.getBalance(firstFunder), "ether").toNumber();

      return instance.fundCampaign(0, {
        from: firstFunder,
        value: fundAmountForFirst
      });
    }).then(function(receipt) {
      assert.equal(receipt.logs.length, 1, "one event should have been triggered");
      assert.equal(receipt.logs[0].event, "FundCampaign", "event should be FundCampaign");
      assert.equal(receipt.logs[0].args._id, 0, "event id must be 0");
      assert.equal(receipt.logs[0].args._funder, firstFunder, "funder must be " + firstFunder);
      assert.equal(receipt.logs[0].args._amountFund, fundAmountForFirst, "funding amount must be " + fundAmountForFirst);
      assert.equal(receipt.logs[0].args._pledgedFund, fundAmountForFirst, "pledged fund must be " + fundAmountForFirst);

      fundedAfter = web3.fromWei(web3.eth.getBalance(firstFunder), "ether").toNumber();
      assert(fundedAfter <= fundedBefore - 20, "funder should have earned 20 ETH");
    });
  });

  it("should be second funding a campaign", function() {
    return Crowdfunding.deployed().then(function(instance) {
      fundedBefore = web3.fromWei(web3.eth.getBalance(secondFunder), "ether").toNumber();

      return instance.fundCampaign(0, {
        from: secondFunder,
        value: fundAmountForSecond
      });
    }).then(function(receipt) {
      assert.equal(receipt.logs.length, 1, "one event should have been triggered");
      assert.equal(receipt.logs[0].event, "FundCampaign", "event should be FundCampaign");
      assert.equal(receipt.logs[0].args._id, 0, "campaign id must be 0");
      assert.equal(receipt.logs[0].args._funder, secondFunder, "campaign creator must be " + secondFunder);
      assert.equal(receipt.logs[0].args._amountFund, fundAmountForSecond, "funding amount must be " + fundAmountForSecond);
      assert.equal(receipt.logs[0].args._pledgedFund, pledgedFunding, "pledged fund must be " + pledgedFunding);

      fundedAfter = web3.fromWei(web3.eth.getBalance(secondFunder), "ether").toNumber();
      assert(fundedAfter <= fundedBefore - 15, "funder should have earned 15 ETH");
    });
  });

  it("should not be campaign creator funded", function() {
    return Crowdfunding.deployed().then(function(instance) {
      return instance.fundCampaign(0, {
        from: firstCreator,
        value: fundAmountForFirst
      });
    }).then(assert.fail)
    .catch(function(error) {
      assert(error.message.indexOf('revert') >= 0, "error message must contain revert");
    });
  });

  it("should not access pledged fund, if not a campaign creator", function() {
    return Crowdfunding.deployed().then(function(instance) {
      return instance.checkFundingGoal(0, {
        from: secondCreator
      });
    }).then(assert.fail)
    .catch(function(error) {
      assert(error.message.indexOf('revert') >= 0, "error message must contain revert");
    });
  });

  it("should not access pledged fund, if don't achieve funding goal", function() {
    return Crowdfunding.deployed().then(function(instance) {
      return instance.checkFundingGoal(1, {
        from: secondCreator
      });
    }).then(assert.fail)
    .catch(function(error) {
      assert(error.message.indexOf('revert') >= 0, "error message must contain revert");
    });
  });

  it("should be closed campaign successfully and creator get fund", function() {
    return Crowdfunding.deployed().then(function(instance) {
      closedBefore = web3.fromWei(web3.eth.getBalance(firstCreator), "ether").toNumber();

      return instance.checkFundingGoal(0, {
        from: firstCreator
      });
    }).then(function(receipt) {
      assert.equal(receipt.logs.length, 1, "one event should have been triggered");
      assert.equal(receipt.logs[0].event, "FundTransfer", "event should be FundTransfer");
      assert.equal(receipt.logs[0].args._id, 0, "campaign id must be 0");
      assert.equal(receipt.logs[0].args._creator, firstCreator, "creator must be " + firstCreator);
      assert.equal(receipt.logs[0].args._pledgedFund, pledgedFunding, "pledged fund must be " + pledgedFunding);
      assert.equal(receipt.logs[0].args._closed, true, "campaign must be closed after transfer")
    });

    closedAfter = web3.fromWei(web3.eth.getBalance(firstCreator), "ether").toNumber();
    assert(closedAfter >= closedBefore + 34, "creator should have spent 35 ETH");
  });

  it("should not be funded to closed campaign", function() {
    return Crowdfunding.deployed().then(function(instance) {
      return instance.fundCampaign(0, {
        from: firstFunder,
        value: fundAmountForFirst
      });
    }).then(assert.fail)
    .catch(function(error) {
      assert(error.message.indexOf('revert') >= 0, "error message must contain revert");
    });
  });
});