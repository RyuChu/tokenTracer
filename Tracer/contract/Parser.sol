pragma solidity >= 0.5.0 < 0.6.0;

contract Parser {
    function parseAsciiToUint(byte char) internal pure returns(uint) {
        uint asciiNum = uint(uint8(char));
        if (asciiNum > 47 && asciiNum < 58) {
            return asciiNum - 48;
        } else if (asciiNum > 96 && asciiNum < 103) {
            return asciiNum - 87;
        } else {
            revert();
        }
    }
    
    function parseStringTo32Bytes(string memory _data) internal pure returns(bytes32) {
        bytes memory _bytes = bytes(_data);
        uint uintString;
        for (uint i = 2; i < 66; i++) {
            uintString = uintString*16 + uint(parseAsciiToUint(_bytes[i]));
        }
        return bytes32(uintString);
    }
    
    function subString(string memory _data, uint startIndex, uint endIndex) internal pure returns(string memory){
        bytes memory _bytes = bytes(_data);
        bytes memory result = new bytes(endIndex-startIndex+2);
        for (uint i = startIndex; i < endIndex; i++) {
            result[i-startIndex+2] = _bytes[i];
        }
        return string(result);
    }
    
    function parseHexToUint256(string memory _data) internal pure returns(uint) {
        uint result;
        bytes memory _bytes = bytes(_data);
        for (uint i = 2; i < _bytes.length; i++) {
            uint digit;
            if (_bytes[i] == 'a' || _bytes[i] == 'A') digit = 10;
            else if (_bytes[i] == 'b' || _bytes[i] == 'B') digit = 11;
            else if (_bytes[i] == 'c' || _bytes[i] == 'C') digit = 12;
            else if (_bytes[i] == 'd' || _bytes[i] == 'D') digit = 13;
            else if (_bytes[i] == 'e' || _bytes[i] == 'E') digit = 14;
            else if (_bytes[i] == 'f' || _bytes[i] == 'F') digit = 15;
            else if (_bytes[i] != 'x') digit = uint8(_bytes[i]) - 48;
            result += digit * (16 ** (_bytes.length - i - 1));
        }
        return result;
    }
    
    function parseAddrressToString(address x) internal pure returns(string memory) {
        bytes memory s = new bytes(40);
        for (uint i = 0; i < 20; i++) {
            byte b = byte(uint8(uint(x) / (2**(8*(19 - i)))));
            byte hi = byte(uint8(b) / 16);
            byte lo = byte(uint8(b) - 16 * uint8(hi));
            s[2*i] = _char(hi);
            s[2*i+1] = _char(lo);            
        }
     return string(s);
    }

    function _char(byte b) internal pure returns(byte c) {
        if (uint8(b) < 10) return byte(uint8(b) + 0x30);
        else return byte(uint8(b) + 0x57);
    }
}