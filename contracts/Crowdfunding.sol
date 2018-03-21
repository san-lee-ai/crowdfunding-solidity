pragma solidity ^0.4.18;

import "./Ownable.sol";
import "./Campaign.sol";

/**
 * @title Crowdfunding
 * @dev 이더리움 기반의 크라우드펀딩 DApp.
 * 프로그래머스(programmers.co.kr) 블록체인 개발 온라인 코스의 실습을 위해 작성되었습니다.
 * programmers.co.kr/learn/courses/[[코스번호]]
 * @author jimmy@grepp.co
 */
contract Crowdfunding is Ownable, Campaign {

    mapping (uint => Campaign) campaigns;
    uint campaignId = 0;

    /**
     * 캠페인 생성을 로깅하는 이벤트
     * @param _id 생성된 캠페인의 id.
     * @param _creater 캠페인 생성자.
     * @param _fundingGoal 생성된 캠페인의 펀딩 목표 금액.
     * @param _pledgedFund 생성된 캠페인이 현제 모금한 금액.
     * @param _deadline 생성된 캠페인의 마감일.
     */
    event GenerateCampaign(
        uint indexed _id,
        address indexed _creater,
        uint256 _fundingGoal,
        uint256 _pledgedFund,
        uint _deadline
    );

    /**
     * 캠페인에 펀딩했을 때 로깅하는 이벤트
     * @param _id 펀딩한 캠페인의 id.
     * @param _funder 펀딩한 사람.
     * @param _amountFund 펀딩한 금액.
     * @param _pledgedFund 현재 캠페인에 펀딩된 금액
     */
    event FundCampaign(
        uint indexed _id,
        address indexed _funder,
        uint256 _amountFund,
        uint256 _pledgedFund
    );

    /**
     * 펀딩된 금액을 캠페인 생성자가 받았음을 로깅하는 이벤트
     * @param _id 해당 캠페인의 id.
     * @param _creater 해당 캠페인 생성자.
     * @param _pledgedFund 펀딩 받은 금액.
     * @param _closed 캠페인이 마감되었는지 여부.
     */
    event FundTransfer(
        uint indexed _id,
        address indexed _creater,
        uint256 _pledgedFund,
        bool _closed
    );

    /**
     * @dev 캠페인의 마감되지 않은 상태만 허용하는 제어자.
     * @param _id 해당 캠페인의 id.
     */
    modifier campaignNotClosed(uint _id) { require(!campaigns[_id].closed); _; }

    /**
     * @dev 캠페인을 만든 사람만 허용하는 제어자.
     * @param _id 해당 캠페인의 id.
     */
    modifier campaignOwner(uint _id) { require(msg.sender == campaigns[_id].creater); _; }

    /**
     * @dev 캠페인을 생성합니다.
     * @param _fundingGoal 펀딩 목표 금액
     */
    function createCampaign(uint256 _fundingGoal) public {
        campaigns[campaignId] = Campaign(campaignId, msg.sender, _fundingGoal,
            0, getDeadline(now), false);

        Campaign memory c = campaigns[campaignId];
        GenerateCampaign(c.id, c.creater, c.fundingGoal, c.pledgedFund, c.deadline);
        campaignId++;
    }

    /**
     * @dev 특정 캠페인에 펀딩을 합니다.
     * @param _campaignId 펀딩하고자 하는 캠페인의 id.
     */
    function fundCampaign(uint _campaignId) payable campaignNotClosed(_campaignId) public {
        require(msg.sender != campaigns[_campaignId].creater);

        campaigns[_campaignId].pledgedFund += msg.value;
        campaigns[_campaignId].balance[msg.sender] += msg.value;

        FundCampaign(_campaignId, msg.sender, msg.value, campaigns[_campaignId].pledgedFund);
    }

    /**
     * @dev 캠페인이 펀딩 목표에 도잘했는지 확인하고 도잘했다면 펀딩된 금액을 받습니다.
     * @param _campaignId 확인하고자 하는 캠페인의 id.
     */
    function checkFundingGoal(uint _campaignId) campaignNotClosed(_campaignId) campaignOwner(_campaignId) public {
        Campaign memory c = campaigns[_campaignId];

        if (c.fundingGoal <= c.pledgedFund) {
            campaigns[_campaignId].closed = true;

            msg.sender.transfer(c.pledgedFund);
            FundTransfer(_campaignId, msg.sender, c.pledgedFund, campaigns[_campaignId].closed);
        } else {
            /**
             * @TODO 요구사항 중 "기간 내에 목표금액을 달성하지 못한 경우,
             * 펀딩 금액은 펀딩한 사람들에게 환불되어야 합니다."는 실습 중에 구현되지 않았습니다.
             * 만약 이를 구현한다면 이 위치에 revert() 대신 들어가게 됩니다.
             */
            revert();
        }
    }

    /**
     * @dev 캠페인 생성 시 일주일 후를 마감일(deadline)로 지정합니다.
     * @param _now 캠페인이 생성되는 순간의 시간
     * @return 일주일 뒤의 시간
     */
    function getDeadline(uint _now) public pure returns (uint) {
        return _now + (3600 * 24 * 7);
    }

    /**
     * @dev 이 계약을 폐기합니다.
     */
    function kill() onlyOwner public {
        selfdestruct(owner);
    }
}
