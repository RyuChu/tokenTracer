pragma solidity >= 0.5.0 < 0.6.0;
import "./provableAPI_0.5.sol";
import "./JsmnSolLib.sol";
import "./Parser.sol";

contract tracerCT {
    address admin;

    constructor() public {
        admin = msg.sender;
    }

    address[] tokenContracts;
    mapping(address => tokenTracer) public tokenTracers;
    
    // 註冊欲追蹤之token合約
    function regTracer(address tokenContract) public {
        // 避免重複註冊相同的token合約
        require(tokenTracers[tokenContract] == tokenTracer(0), "Duplicate Registration");
        
        // 建立儲存之資料庫
        tokenTracer newTracer = new tokenTracer(tokenContract, address(this));
        tokenTracers[tokenContract] = newTracer;
        
        // 儲存欲追蹤的token合約地址
        tokenContracts.push(tokenContract);
    }
    
    function getTokenContract() public view returns (address[] memory) {
        return tokenContracts;
    }
}

contract tokenTracer is usingProvable, Parser {
    address public tokenContract;
    address public CT;
    uint public tracerBalance;
    uint public syncBlockHeight;
    uint public realBlockHeight;
    uint private syncIndex;
    bool public oraclizeIsRunning;
    bool public oraclizeIsDone;
    
    event LogNewOraclizeQuery(string description);
    
    constructor(address _tokenContract, address _CT) public {
        tokenContract = _tokenContract;
        CT = _CT;
    }
    
    enum oraclizeState { ForBlockHeight, ForTracer }

    struct oraclizeCallback {
        oraclizeState oState;
    }
    mapping (bytes32 => oraclizeCallback) public oraclizeCallbacks;
    
    // oraclize results
    function __callback(bytes32 myid, string memory _result) public {
        if (msg.sender != provable_cbAddress()) revert();
        // 更新合約餘額
        tracerBalance = address(this).balance;
        
        oraclizeCallback memory o = oraclizeCallbacks[myid];
        if (o.oState == oraclizeState.ForBlockHeight) {
            realBlockHeight = parseHexToUint256(_result);
        } else if (o.oState == oraclizeState.ForTracer) {
            // 檢查是否有回傳值
            if (bytes(_result).length != 0) {
                savingTx(_result);
            }
        }
    }
    
    function updateBlockHeight() payable public {
         // 檢查是否有足夠的錢
        if (address(this).balance < 5000000000000000000) { // < 5 ether
            emit LogNewOraclizeQuery("Oraclize query was NOT sent, please add some ETH to cover for the query fee");
            oraclizeIsRunning = false;
        } else {
            emit LogNewOraclizeQuery("Oraclize query was sent, standing by for the answer..");
            oraclizeIsRunning = true;
            
            string memory apiUrl = "json(https://api.etherscan.io/api?module=proxy&action=eth_blockNumber&apikey=HTI3IX924Z1IBXIIN4992VRAPKHJI149AX).result";
            bytes32 queryId = provable_query("URL", apiUrl);
            oraclizeCallbacks[queryId] = oraclizeCallback(oraclizeState.ForBlockHeight);
        }
    }
    
    // call oraclize
    function traceTx() payable public {
        uint gasLimit = 1000000000;
        
        // 檢查是否有足夠的錢
        if (address(this).balance < 5000000000000000000) { // < 5 ether
            emit LogNewOraclizeQuery("Oraclize query was NOT sent, please add some ETH to cover for the query fee");
            oraclizeIsRunning = false;
        } else {
            emit LogNewOraclizeQuery("Oraclize query was sent, standing by for the answer..");
            oraclizeIsRunning = true;
            
            // 設定為每次Oraclize取得的交易筆數[:Count]
            string memory apiStr1 = "json(https://api.etherscan.io/api?module=logs&action=getLogs&fromBlock=";
            string memory apiStr2 = "&toBlock=latest";
            string memory apiStr3 = "&address=0x";
            string memory apiStr4 = "&topic0=0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";
            string memory apiStr5 = "&apikey=HTI3IX924Z1IBXIIN4992VRAPKHJI149AX).result[";
            string memory apiStr6 = "][transactionHash, blockNumber, timeStamp, topics, data]";
            string memory apiUrl = string(abi.encodePacked(apiStr1, uint2str(syncBlockHeight), apiStr2, apiStr3, parseAddrressToString(tokenContract), apiStr4, apiStr5, uint2str(syncIndex), ":", uint2str(syncIndex + 250), apiStr6));
            bytes32 queryId = provable_query("URL", apiUrl, gasLimit);
            oraclizeCallbacks[queryId] = oraclizeCallback(oraclizeState.ForTracer);
        }
        updateBlockHeight();
    }
    
    bytes32[] transactionHash;
    address[] sender;
    address[] receiver;
    uint[] value;
    uint[] blockNumber;
    uint[] timeStamp;
    
    // 取得已儲存之交易筆數
    uint public transactionCount;
    
    mapping(bytes32 => bool) private isExist;
    
    function savingTx(string memory json) internal {
        uint returnValue;
        JsmnSolLib.Token[] memory tokens;
        uint actualNum;

        // (returnValue, tokens, actualNum) = JsmnSolLib.parse(json, 9);
        (returnValue, tokens, actualNum) = JsmnSolLib.parse(json, 2250);
        
        // 迴圈設定每次Oraclize取得之交易筆數
        for (uint i = 0; i < 250; i++) {
            JsmnSolLib.Token memory a = tokens[1 + 8*i];
            bytes32 _transactionHash = parseStringTo32Bytes(JsmnSolLib.getBytes(json, a.start, a.end));
            // 避免重複紀錄同一筆交易
            if (!isExist[_transactionHash] && _transactionHash != "") {
                isExist[_transactionHash] = true;
                transactionHash.push(_transactionHash);
                JsmnSolLib.Token memory b = tokens[2 + 8*i];
                uint _blockNumber = parseHexToUint256(JsmnSolLib.getBytes(json, b.start, b.end));
                blockNumber.push(_blockNumber);
                JsmnSolLib.Token memory c = tokens[3 + 8*i];
                timeStamp.push(parseHexToUint256(JsmnSolLib.getBytes(json, c.start, c.end)));
                JsmnSolLib.Token memory d = tokens[6 + 8*i];
                sender.push(parseAddr(subString(JsmnSolLib.getBytes(json, d.start, d.end), 26, 66)));
                JsmnSolLib.Token memory e = tokens[7 + 8*i];
                receiver.push(parseAddr(subString(JsmnSolLib.getBytes(json, e.start, e.end), 26, 66)));
                JsmnSolLib.Token memory f = tokens[8 + 8*i];
                value.push(parseHexToUint256(JsmnSolLib.getBytes(json, f.start, f.end)));
                
                // 更新下回開始搜尋之blockNumber, 需避免同一block有多筆交易
                syncBlockHeight = _blockNumber;
                syncIndex = 0;
            } else if (_transactionHash == "") {
                syncBlockHeight = realBlockHeight;
                syncIndex = 0;
                oraclizeIsDone = true;
                break;
            }
        }
        if (transactionCount == transactionHash.length) {
            syncIndex = 250;
        }
        transactionCount = transactionHash.length;
        oraclizeIsRunning = false;
    }
    
    // 取得查詢交儲存之交易結果
    function token_query(uint index, uint count) public view returns(bytes32[] memory _transactionHash, address[] memory _sender, address[] memory _receiver, uint[] memory _value, uint[] memory _blockNumber, uint[] memory _timestamp) {
        if (index-1 + count > transactionCount) {
            count = transactionCount - (index-1);
        }

        _transactionHash = new bytes32[](count);
        _sender = new address[](count);
        _receiver = new address[](count);
        _value = new uint[](count);
        _blockNumber = new uint[](count);
        _timestamp = new uint[](count);
        for (uint i = 0; i < count; i++) {
            _transactionHash[i] = transactionHash[index-1 + i];
            _sender[i] = sender[index-1 + i];
            _receiver[i] = receiver[index-1 + i];
            _value[i] = value[index-1 + i];
            _blockNumber[i] = blockNumber[index-1 + i];
            _timestamp[i] = timeStamp[index-1 + i];
        }
    }
    
    function token_queryTime(uint startTime, uint endTime, uint checkPoint) public view returns(uint _checkPoint, bytes32[] memory _transactionHash, address[] memory _sender, address[] memory _receiver, uint[] memory _value, uint[] memory _blockNumber, uint[] memory _timestamp) {
        uint size;
        uint[] memory index = new uint[](transactionHash.length);
        for (uint i = checkPoint; i < transactionHash.length && size < 100; i++) {
            if (startTime <= timeStamp[i] && endTime >= timeStamp[i]) {
                index[size] = i;
                size++;
            }
            _checkPoint = i;
        }
        
        _transactionHash = new bytes32[](size);
        _sender = new address[](size);
        _receiver = new address[](size);
        _value = new uint[](size);
        _blockNumber = new uint[](size);
        _timestamp = new uint[](size);
        for (uint i = 0; i < size; i++) {
            _transactionHash[i] = transactionHash[index[i]];
            _sender[i] = sender[index[i]];
            _receiver[i] = receiver[index[i]];
            _value[i] = value[index[i]];
            _blockNumber[i] = blockNumber[index[i]];
            _timestamp[i] = timeStamp[index[i]];
        }
    }
    
    function token_queryTime(uint startTime, uint endTime, address account, uint searchType, uint checkPoint) public view returns(uint _checkPoint, bytes32[] memory _transactionHash, address[] memory _sender, address[] memory _receiver, uint[] memory _value, uint[] memory _blockNumber, uint[] memory _timestamp) {
        uint size;
        uint[] memory index = new uint[](transactionHash.length);
        for (uint i = checkPoint; i < transactionHash.length && size < 100; i++) {
            if (searchType == 0) {
                if (startTime <= timeStamp[i] && endTime >= timeStamp[i] && account == sender[i]) {
                    index[size] = i;
                    size++;
                }
            } else {
                if (startTime <= timeStamp[i] && endTime >= timeStamp[i] && account == receiver[i]) {
                    index[size] = i;
                    size++;
                }
            }
            _checkPoint = i;
        }
        
        _transactionHash = new bytes32[](size);
        _sender = new address[](size);
        _receiver = new address[](size);
        _value = new uint[](size);
        _blockNumber = new uint[](size);
        _timestamp = new uint[](size);
        for (uint i = 0; i < size; i++) {
            _transactionHash[i] = transactionHash[index[i]];
            _sender[i] = sender[index[i]];
            _receiver[i] = receiver[index[i]];
            _value[i] = value[index[i]];
            _blockNumber[i] = blockNumber[index[i]];
            _timestamp[i] = timeStamp[index[i]];
        }
    }
    
    function token_queryTime(uint startTime, uint endTime, address s, address r) public view returns(bytes32[] memory _transactionHash, address[] memory _sender, address[] memory _receiver, uint[] memory _value, uint[] memory _blockNumber, uint[] memory _timestamp) {
        uint size;
        uint[] memory index = new uint[](transactionHash.length);
        for (uint i = 0; i < transactionHash.length; i++) {
            if (startTime <= timeStamp[i] && endTime >= timeStamp[i] && s == sender[i] && r == receiver[i]) {
                index[size] = i;
                size++;
            }
        }
        
        _transactionHash = new bytes32[](size);
        _sender = new address[](size);
        _receiver = new address[](size);
        _value = new uint[](size);
        _blockNumber = new uint[](size);
        _timestamp = new uint[](size);
        for (uint i = 0; i < size; i++) {
            _transactionHash[i] = transactionHash[index[i]];
            _sender[i] = sender[index[i]];
            _receiver[i] = receiver[index[i]];
            _value[i] = value[index[i]];
            _blockNumber[i] = blockNumber[index[i]];
            _timestamp[i] = timeStamp[index[i]];
        }
    }
    
    function token_queryBlock(uint startBlock, uint endBlock, uint checkPoint) public view returns(uint _checkPoint, bytes32[] memory _transactionHash, address[] memory _sender, address[] memory _receiver, uint[] memory _value, uint[] memory _blockNumber, uint[] memory _timestamp) {
        uint size;
        uint[] memory index = new uint[](transactionHash.length);
        for (uint i = checkPoint; i < transactionHash.length && size < 100; i++) {
            if (startBlock <= blockNumber[i] && endBlock >= blockNumber[i]) {
                index[size] = i;
                size++;
            }
            _checkPoint = i;
        }
        
        _transactionHash = new bytes32[](size);
        _sender = new address[](size);
        _receiver = new address[](size);
        _value = new uint[](size);
        _blockNumber = new uint[](size);
        _timestamp = new uint[](size);
        for (uint i = 0; i < size; i++) {
            _transactionHash[i] = transactionHash[index[i]];
            _sender[i] = sender[index[i]];
            _receiver[i] = receiver[index[i]];
            _value[i] = value[index[i]];
            _blockNumber[i] = blockNumber[index[i]];
            _timestamp[i] = timeStamp[index[i]];
        }
    }
    
    function token_queryBlock(uint startBlock, uint endBlock, address account, uint searchType, uint checkPoint) public view returns(uint _checkPoint, bytes32[] memory _transactionHash, address[] memory _sender, address[] memory _receiver, uint[] memory _value, uint[] memory _blockNumber, uint[] memory _timestamp) {
        uint size;
        uint[] memory index = new uint[](transactionHash.length);
        for (uint i = checkPoint; i < transactionHash.length && size < 100; i++) {
            if (searchType == 0) {
                if (startBlock <= blockNumber[i] && endBlock >= blockNumber[i] && account == sender[i]) {
                    index[size] = i;
                    size++;
                }
            } else {
                if (startBlock <= blockNumber[i] && endBlock >= blockNumber[i] && account == receiver[i]) {
                    index[size] = i;
                    size++;
                }
            }
            _checkPoint = i;
        }
        
        _transactionHash = new bytes32[](size);
        _sender = new address[](size);
        _receiver = new address[](size);
        _value = new uint[](size);
        _blockNumber = new uint[](size);
        _timestamp = new uint[](size);
        for (uint i = 0; i < size; i++) {
            _transactionHash[i] = transactionHash[index[i]];
            _sender[i] = sender[index[i]];
            _receiver[i] = receiver[index[i]];
            _value[i] = value[index[i]];
            _blockNumber[i] = blockNumber[index[i]];
            _timestamp[i] = timeStamp[index[i]];
        }
    }
    
    function token_queryBlock(uint startBlock, uint endBlock, address s, address r) public view returns(bytes32[] memory _transactionHash, address[] memory _sender, address[] memory _receiver, uint[] memory _value, uint[] memory _blockNumber, uint[] memory _timestamp) {
        uint size;
        uint[] memory index = new uint[](transactionHash.length);
        for (uint i = 0; i < transactionHash.length; i++) {
            if (startBlock <= blockNumber[i] && endBlock >= blockNumber[i] && s == sender[i] && r == receiver[i]) {
                index[size] = i;
                size++;
            }
        }
        
        _transactionHash = new bytes32[](size);
        _sender = new address[](size);
        _receiver = new address[](size);
        _value = new uint[](size);
        _blockNumber = new uint[](size);
        _timestamp = new uint[](size);
        for (uint i = 0; i < size; i++) {
            _transactionHash[i] = transactionHash[index[i]];
            _sender[i] = sender[index[i]];
            _receiver[i] = receiver[index[i]];
            _value[i] = value[index[i]];
            _blockNumber[i] = blockNumber[index[i]];
            _timestamp[i] = timeStamp[index[i]];
        }
    }
}