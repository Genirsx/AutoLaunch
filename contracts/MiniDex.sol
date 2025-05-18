// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IERC20 {
    function transfer(address to, uint amount) external returns (bool);
    function transferFrom(address from, address to, uint amount) external returns (bool);
}

contract MiniDex {
    IERC20 public tokenA;
    IERC20 public tokenB;

    uint public reserveA;
    uint public reserveB;
    uint public totalSupply;
    mapping(address => uint) private _balanceOf;

    uint public constant FEE = 3; // 0.3%

    event LiquidityAdded(address indexed provider, uint amountA, uint amountB, uint liquidity);
    event LiquidityRemoved(address indexed provider, uint amountA, uint amountB, uint liquidity);
    event Swapped(address indexed user, address inputToken, uint amountIn, uint amountOut);

    constructor(address _tokenA, address _tokenB) {
        tokenA = IERC20(_tokenA);
        tokenB = IERC20(_tokenB);
    }

    function balanceOf(address user) external view returns (uint) {
        return _balanceOf[user];
    }

    function addLiquidity(uint amountA, uint amountB) external returns (uint liquidity) {
        require(amountA > 0 && amountB > 0, "Invalid amount");

        if (reserveA == 0 && reserveB == 0) {
            // First time adding liquidity
            require(tokenA.transferFrom(msg.sender, address(this), amountA), "TokenA transfer failed");
            require(tokenB.transferFrom(msg.sender, address(this), amountB), "TokenB transfer failed");

            liquidity = sqrt(amountA * amountB);
            _mint(msg.sender, liquidity);
            _update(amountA, amountB);

            emit LiquidityAdded(msg.sender, amountA, amountB, liquidity);
        } else {
            // Optimal amount calculation
            uint amountBOptimal = (amountA * reserveB) / reserveA;
            uint amountAOptimal = (amountB * reserveA) / reserveB;

            if (amountB >= amountBOptimal) {
                require(tokenA.transferFrom(msg.sender, address(this), amountA), "TokenA transfer failed");
                require(tokenB.transferFrom(msg.sender, address(this), amountBOptimal), "TokenB transfer failed");

                liquidity = (amountA * totalSupply) / reserveA;
                _mint(msg.sender, liquidity);
                _update(reserveA + amountA, reserveB + amountBOptimal);

                emit LiquidityAdded(msg.sender, amountA, amountBOptimal, liquidity);
            } else if (amountA >= amountAOptimal) {
                require(tokenA.transferFrom(msg.sender, address(this), amountAOptimal), "TokenA transfer failed");
                require(tokenB.transferFrom(msg.sender, address(this), amountB), "TokenB transfer failed");

                liquidity = (amountB * totalSupply) / reserveB;
                _mint(msg.sender, liquidity);
                _update(reserveA + amountAOptimal, reserveB + amountB);

                emit LiquidityAdded(msg.sender, amountAOptimal, amountB, liquidity);
            } else {
                revert("Invalid ratio");
            }
        }

        return liquidity;
    }

    function removeLiquidity(uint liquidity) external {
        require(liquidity > 0 && _balanceOf[msg.sender] >= liquidity, "Invalid liquidity");

        uint amountA = (liquidity * reserveA) / totalSupply;
        uint amountB = (liquidity * reserveB) / totalSupply;

        _burn(msg.sender, liquidity);
        _update(reserveA - amountA, reserveB - amountB);

        require(tokenA.transfer(msg.sender, amountA), "TokenA transfer failed");
        require(tokenB.transfer(msg.sender, amountB), "TokenB transfer failed");

        emit LiquidityRemoved(msg.sender, amountA, amountB, liquidity);
    }

    function swap(address inputToken, uint amountIn) external returns (uint amountOut) {
        require(
            inputToken == address(tokenA) || inputToken == address(tokenB),
            "Invalid token"
        );
        require(amountIn > 0, "Amount must be positive");

        uint fee = (amountIn * FEE) / 1000;
        uint amountInAfterFee = amountIn - fee;

        uint reserveIn;
        uint reserveOut;

        if (inputToken == address(tokenA)) {
            reserveIn = reserveA;
            reserveOut = reserveB;

            amountOut = (amountInAfterFee * reserveOut) / (reserveIn + amountInAfterFee);

            require(tokenA.transferFrom(msg.sender, address(this), amountIn), "TokenA transfer failed");
            require(tokenB.transfer(msg.sender, amountOut), "TokenB transfer failed");

            reserveA += amountIn;
            reserveB -= amountOut;
        } else {
            reserveIn = reserveB;
            reserveOut = reserveA;

            amountOut = (amountInAfterFee * reserveOut) / (reserveIn + amountInAfterFee);

            require(tokenB.transferFrom(msg.sender, address(this), amountIn), "TokenB transfer failed");
            require(tokenA.transfer(msg.sender, amountOut), "TokenA transfer failed");

            reserveB += amountIn;
            reserveA -= amountOut;
        }

        _update(reserveA, reserveB);

        emit Swapped(msg.sender, inputToken, amountIn, amountOut);
        return amountOut;
    }

    // Internal utilities
    function _update(uint _reserveA, uint _reserveB) private {
        reserveA = _reserveA;
        reserveB = _reserveB;
    }

    function _mint(address to, uint amount) private {
        _balanceOf[to] += amount;
        totalSupply += amount;
    }

    function _burn(address from, uint amount) private {
        _balanceOf[from] -= amount;
        totalSupply -= amount;
    }

    function sqrt(uint x) private pure returns (uint y) {
        uint z = (x + 1) / 2;
        y = x;
        while (z < y) {
            y = z;
            z = (x / z + z) / 2;
        }
    }
}
