//+------------------------------------------------------------------+
//|                                                  ICT_Beast_EA.mq5 |
//|                                    Advanced ICT Strategy EA       |
//|                                                                    |
//+------------------------------------------------------------------+
#property copyright "EmaScript ICT Beast"
#property link      "https://emascript.com"
#property version   "1.00"

#include <Trade\Trade.mqh>
#include <Trade\PositionInfo.mqh>
#include <Trade\OrderInfo.mqh>

//--- Input Parameters
input group "=== Risk Management ==="
input double RiskPercent = 1.0;                    // Risk per trade (%)
input double RiskRewardRatio = 2.0;                // Risk:Reward Ratio
input double MaxDailyLoss = 3.0;                   // Max daily loss (%)
input int MaxOpenTrades = 3;                       // Maximum open trades
input double MaxLotSize = 10.0;                    // Maximum lot size

input group "=== ICT Strategy Settings ==="
input int FVG_MinPoints = 20;                      // Fair Value Gap minimum points
input bool TradeOrderBlocks = true;                // Trade Order Blocks
input bool TradeFairValueGaps = true;              // Trade Fair Value Gaps
input bool UseLiquidityGrabs = true;               // Use Liquidity Grabs
input double OTE_FibLow = 0.62;                    // OTE Fibonacci Low
input double OTE_FibHigh = 0.79;                   // OTE Fibonacci High

input group "=== Kill Zones (Server Time) ==="
input bool UseKillZones = true;                    // Use Kill Zones
input int LondonKillZoneStart = 2;                 // London Kill Zone Start (Hour)
input int LondonKillZoneEnd = 5;                   // London Kill Zone End (Hour)
input int NYKillZoneStart = 7;                     // NY Kill Zone Start (Hour)
input int NYKillZoneEnd = 10;                      // NY Kill Zone End (Hour)

input group "=== Market Structure ==="
input int SwingPoints = 20;                        // Swing points lookback
input ENUM_TIMEFRAMES StructureTimeframe = PERIOD_H1;  // Structure timeframe
input bool TradeWithTrend = true;                  // Only trade with trend

input group "=== Stop Loss & Take Profit ==="
input int StopLossPoints = 300;                    // Stop Loss in points (0 = auto)
input int TakeProfitPoints = 600;                  // Take Profit in points (0 = auto)
input bool UseTrailingStop = true;                 // Use trailing stop
input int TrailingStopPoints = 200;                // Trailing stop distance
input int TrailingStepPoints = 50;                 // Trailing step

input group "=== Time Settings ==="
input int MagicNumber = 123456;                    // Magic Number
input string TradeComment = "ICT_Beast";           // Trade Comment
input bool TradeSunday = false;                    // Trade on Sunday
input bool TradeFriday = true;                     // Trade on Friday

//--- Global Variables
CTrade trade;
CPositionInfo positionInfo;
COrderInfo orderInfo;

datetime lastBarTime = 0;
double dailyProfit = 0;
datetime lastDayChecked = 0;

struct OrderBlock {
    double high;
    double low;
    datetime time;
    bool isBullish;
    bool isValid;
};

struct FairValueGap {
    double top;
    double bottom;
    datetime time;
    bool isBullish;
    bool isFilled;
};

OrderBlock orderBlocks[];
FairValueGap fvgArray[];

//+------------------------------------------------------------------+
//| Expert initialization function                                   |
//+------------------------------------------------------------------+
int OnInit()
{
    trade.SetExpertMagicNumber(MagicNumber);
    trade.SetDeviationInPoints(10);
    trade.SetTypeFilling(ORDER_FILLING_FOK);
    trade.SetAsyncMode(false);
    
    Print("ICT Beast EA Initialized Successfully!");
    Print("Symbol: ", _Symbol);
    Print("Risk per trade: ", RiskPercent, "%");
    Print("Risk:Reward Ratio: ", RiskRewardRatio, ":1");
    
    ArrayResize(orderBlocks, 0);
    ArrayResize(fvgArray, 0);
    
    return(INIT_SUCCEEDED);
}

//+------------------------------------------------------------------+
//| Expert deinitialization function                                 |
//+------------------------------------------------------------------+
void OnDeinit(const int reason)
{
    Print("ICT Beast EA Stopped. Reason: ", reason);
}

//+------------------------------------------------------------------+
//| Expert tick function                                             |
//+------------------------------------------------------------------+
void OnTick()
{
    //--- Check for new bar
    datetime currentBarTime = iTime(_Symbol, _Period, 0);
    if(currentBarTime == lastBarTime)
        return;
    lastBarTime = currentBarTime;
    
    //--- Check daily loss limit
    CheckDailyLoss();
    if(dailyProfit <= -MaxDailyLoss)
    {
        Print("Daily loss limit reached. Stopping trading for today.");
        return;
    }
    
    //--- Check day of week
    MqlDateTime tm;
    TimeCurrent(tm);
    if(!TradeSunday && tm.day_of_week == 0)
        return;
    if(!TradeFriday && tm.day_of_week == 5 && tm.hour >= 20)
        return;
    
    //--- Check kill zones
    if(UseKillZones && !IsInKillZone())
        return;
    
    //--- Update trailing stops
    if(UseTrailingStop)
        UpdateTrailingStops();
    
    //--- Check max open trades
    if(CountOpenTrades() >= MaxOpenTrades)
        return;
    
    //--- Identify market structure
    int marketStructure = GetMarketStructure();
    
    //--- Update Order Blocks and FVGs
    if(TradeOrderBlocks)
        UpdateOrderBlocks();
    if(TradeFairValueGaps)
        UpdateFairValueGaps();
    
    //--- Look for trading opportunities
    CheckForTradeSetup(marketStructure);
}

//+------------------------------------------------------------------+
//| Check for trade setup                                            |
//+------------------------------------------------------------------+
void CheckForTradeSetup(int marketStructure)
{
    double currentPrice = SymbolInfoDouble(_Symbol, SYMBOL_BID);
    
    //--- Bullish Setup (Buy)
    if(marketStructure == 1 || !TradeWithTrend)
    {
        if(TradeOrderBlocks && CheckBullishOrderBlock(currentPrice))
        {
            OpenBuyTrade("Bullish OB");
            return;
        }
        
        if(TradeFairValueGaps && CheckBullishFVG(currentPrice))
        {
            OpenBuyTrade("Bullish FVG");
            return;
        }
    }
    
    //--- Bearish Setup (Sell)
    if(marketStructure == -1 || !TradeWithTrend)
    {
        if(TradeOrderBlocks && CheckBearishOrderBlock(currentPrice))
        {
            OpenSellTrade("Bearish OB");
            return;
        }
        
        if(TradeFairValueGaps && CheckBearishFVG(currentPrice))
        {
            OpenSellTrade("Bearish FVG");
            return;
        }
    }
}

//+------------------------------------------------------------------+
//| Get market structure (1=Bullish, -1=Bearish, 0=Range)           |
//+------------------------------------------------------------------+
int GetMarketStructure()
{
    double highs[], lows[];
    ArraySetAsSeries(highs, true);
    ArraySetAsSeries(lows, true);
    
    int copied_high = CopyHigh(_Symbol, StructureTimeframe, 0, SwingPoints + 10, highs);
    int copied_low = CopyLow(_Symbol, StructureTimeframe, 0, SwingPoints + 10, lows);
    
    if(copied_high < SwingPoints || copied_low < SwingPoints)
        return 0;
    
    //--- Count higher highs and higher lows
    int higherHighs = 0, higherLows = 0;
    int lowerHighs = 0, lowerLows = 0;
    
    for(int i = 1; i < SwingPoints; i++)
    {
        if(highs[i] > highs[i+1]) higherHighs++;
        if(highs[i] < highs[i+1]) lowerHighs++;
        if(lows[i] > lows[i+1]) higherLows++;
        if(lows[i] < lows[i+1]) lowerLows++;
    }
    
    //--- Determine trend
    if(higherHighs > lowerHighs && higherLows > lowerLows)
        return 1;  // Bullish
    else if(lowerHighs > higherHighs && lowerLows > higherLows)
        return -1; // Bearish
    
    return 0; // Range
}

//+------------------------------------------------------------------+
//| Update Order Blocks                                              |
//+------------------------------------------------------------------+
void UpdateOrderBlocks()
{
    double high[], low[], close[], open[];
    ArraySetAsSeries(high, true);
    ArraySetAsSeries(low, true);
    ArraySetAsSeries(close, true);
    ArraySetAsSeries(open, true);
    
    int bars = 50;
    CopyHigh(_Symbol, _Period, 0, bars, high);
    CopyLow(_Symbol, _Period, 0, bars, low);
    CopyClose(_Symbol, _Period, 0, bars, close);
    CopyOpen(_Symbol, _Period, 0, bars, open);
    
    //--- Find bullish order blocks (down candle followed by strong up move)
    for(int i = 3; i < bars - 3; i++)
    {
        // Bearish candle
        if(close[i] < open[i])
        {
            // Followed by bullish move
            if(close[i-1] > high[i] && close[i-1] > close[i-2])
            {
                AddOrderBlock(high[i], low[i], iTime(_Symbol, _Period, i), true);
            }
        }
        
        // Bullish candle
        if(close[i] > open[i])
        {
            // Followed by bearish move
            if(close[i-1] < low[i] && close[i-1] < close[i-2])
            {
                AddOrderBlock(high[i], low[i], iTime(_Symbol, _Period, i), false);
            }
        }
    }
    
    //--- Clean old order blocks
    CleanOldOrderBlocks();
}

//+------------------------------------------------------------------+
//| Add Order Block                                                  |
//+------------------------------------------------------------------+
void AddOrderBlock(double h, double l, datetime t, bool bullish)
{
    int size = ArraySize(orderBlocks);
    
    // Check if already exists
    for(int i = 0; i < size; i++)
    {
        if(orderBlocks[i].time == t)
            return;
    }
    
    ArrayResize(orderBlocks, size + 1);
    orderBlocks[size].high = h;
    orderBlocks[size].low = l;
    orderBlocks[size].time = t;
    orderBlocks[size].isBullish = bullish;
    orderBlocks[size].isValid = true;
}

//+------------------------------------------------------------------+
//| Update Fair Value Gaps                                           |
//+------------------------------------------------------------------+
void UpdateFairValueGaps()
{
    double high[], low[];
    ArraySetAsSeries(high, true);
    ArraySetAsSeries(low, true);
    
    int bars = 50;
    CopyHigh(_Symbol, _Period, 0, bars, high);
    CopyLow(_Symbol, _Period, 0, bars, low);
    
    double point = SymbolInfoDouble(_Symbol, SYMBOL_POINT);
    
    //--- Find Fair Value Gaps
    for(int i = 2; i < bars - 1; i++)
    {
        // Bullish FVG (gap between candle 3 low and candle 1 high)
        if(low[i-2] > high[i])
        {
            double gapSize = (low[i-2] - high[i]) / point;
            if(gapSize >= FVG_MinPoints)
            {
                AddFVG(low[i-2], high[i], iTime(_Symbol, _Period, i), true);
            }
        }
        
        // Bearish FVG (gap between candle 3 high and candle 1 low)
        if(high[i-2] < low[i])
        {
            double gapSize = (low[i] - high[i-2]) / point;
            if(gapSize >= FVG_MinPoints)
            {
                AddFVG(low[i], high[i-2], iTime(_Symbol, _Period, i), false);
            }
        }
    }
    
    //--- Update FVG status
    UpdateFVGStatus();
}

//+------------------------------------------------------------------+
//| Add Fair Value Gap                                              |
//+------------------------------------------------------------------+
void AddFVG(double top, double bottom, datetime t, bool bullish)
{
    int size = ArraySize(fvgArray);
    
    // Check if already exists
    for(int i = 0; i < size; i++)
    {
        if(fvgArray[i].time == t)
            return;
    }
    
    ArrayResize(fvgArray, size + 1);
    fvgArray[size].top = top;
    fvgArray[size].bottom = bottom;
    fvgArray[size].time = t;
    fvgArray[size].isBullish = bullish;
    fvgArray[size].isFilled = false;
}

//+------------------------------------------------------------------+
//| Check Bullish Order Block                                        |
//+------------------------------------------------------------------+
bool CheckBullishOrderBlock(double currentPrice)
{
    double bid = SymbolInfoDouble(_Symbol, SYMBOL_BID);
    double ask = SymbolInfoDouble(_Symbol, SYMBOL_ASK);
    
    for(int i = 0; i < ArraySize(orderBlocks); i++)
    {
        if(orderBlocks[i].isBullish && orderBlocks[i].isValid)
        {
            // Check if price is in the order block zone
            if(bid >= orderBlocks[i].low && bid <= orderBlocks[i].high)
            {
                // Check OTE levels (0.62-0.79 retracement)
                double range = orderBlocks[i].high - orderBlocks[i].low;
                double ote_low = orderBlocks[i].low + (range * OTE_FibLow);
                double ote_high = orderBlocks[i].low + (range * OTE_FibHigh);
                
                if(bid >= ote_low && bid <= ote_high)
                {
                    orderBlocks[i].isValid = false; // Invalidate after use
                    return true;
                }
            }
        }
    }
    
    return false;
}

//+------------------------------------------------------------------+
//| Check Bearish Order Block                                        |
//+------------------------------------------------------------------+
bool CheckBearishOrderBlock(double currentPrice)
{
    double bid = SymbolInfoDouble(_Symbol, SYMBOL_BID);
    
    for(int i = 0; i < ArraySize(orderBlocks); i++)
    {
        if(!orderBlocks[i].isBullish && orderBlocks[i].isValid)
        {
            // Check if price is in the order block zone
            if(bid >= orderBlocks[i].low && bid <= orderBlocks[i].high)
            {
                // Check OTE levels
                double range = orderBlocks[i].high - orderBlocks[i].low;
                double ote_low = orderBlocks[i].high - (range * OTE_FibHigh);
                double ote_high = orderBlocks[i].high - (range * OTE_FibLow);
                
                if(bid >= ote_low && bid <= ote_high)
                {
                    orderBlocks[i].isValid = false;
                    return true;
                }
            }
        }
    }
    
    return false;
}

//+------------------------------------------------------------------+
//| Check Bullish FVG                                                |
//+------------------------------------------------------------------+
bool CheckBullishFVG(double currentPrice)
{
    double bid = SymbolInfoDouble(_Symbol, SYMBOL_BID);
    
    for(int i = 0; i < ArraySize(fvgArray); i++)
    {
        if(fvgArray[i].isBullish && !fvgArray[i].isFilled)
        {
            // Price entered the FVG zone
            if(bid >= fvgArray[i].bottom && bid <= fvgArray[i].top)
            {
                // Look for 50% fill (optimal entry)
                double midpoint = (fvgArray[i].top + fvgArray[i].bottom) / 2;
                if(bid <= midpoint + (fvgArray[i].top - fvgArray[i].bottom) * 0.2 &&
                   bid >= midpoint - (fvgArray[i].top - fvgArray[i].bottom) * 0.2)
                {
                    fvgArray[i].isFilled = true;
                    return true;
                }
            }
        }
    }
    
    return false;
}

//+------------------------------------------------------------------+
//| Check Bearish FVG                                                |
//+------------------------------------------------------------------+
bool CheckBearishFVG(double currentPrice)
{
    double bid = SymbolInfoDouble(_Symbol, SYMBOL_BID);
    
    for(int i = 0; i < ArraySize(fvgArray); i++)
    {
        if(!fvgArray[i].isBullish && !fvgArray[i].isFilled)
        {
            if(bid >= fvgArray[i].bottom && bid <= fvgArray[i].top)
            {
                double midpoint = (fvgArray[i].top + fvgArray[i].bottom) / 2;
                if(bid <= midpoint + (fvgArray[i].top - fvgArray[i].bottom) * 0.2 &&
                   bid >= midpoint - (fvgArray[i].top - fvgArray[i].bottom) * 0.2)
                {
                    fvgArray[i].isFilled = true;
                    return true;
                }
            }
        }
    }
    
    return false;
}

//+------------------------------------------------------------------+
//| Open Buy Trade                                                   |
//+------------------------------------------------------------------+
void OpenBuyTrade(string signal)
{
    double ask = SymbolInfoDouble(_Symbol, SYMBOL_ASK);
    double bid = SymbolInfoDouble(_Symbol, SYMBOL_BID);
    double point = SymbolInfoDouble(_Symbol, SYMBOL_POINT);
    int digits = (int)SymbolInfoInteger(_Symbol, SYMBOL_DIGITS);
    
    //--- Calculate lot size
    double lotSize = CalculateLotSize(StopLossPoints);
    if(lotSize < SymbolInfoDouble(_Symbol, SYMBOL_VOLUME_MIN))
        lotSize = SymbolInfoDouble(_Symbol, SYMBOL_VOLUME_MIN);
    if(lotSize > MaxLotSize)
        lotSize = MaxLotSize;
    
    //--- Calculate SL and TP
    double sl = 0, tp = 0;
    
    if(StopLossPoints > 0)
        sl = NormalizeDouble(ask - StopLossPoints * point, digits);
    
    if(TakeProfitPoints > 0)
        tp = NormalizeDouble(ask + TakeProfitPoints * point, digits);
    else if(StopLossPoints > 0)
        tp = NormalizeDouble(ask + (StopLossPoints * RiskRewardRatio * point), digits);
    
    //--- Open trade
    string comment = TradeComment + " " + signal;
    
    if(trade.Buy(lotSize, _Symbol, ask, sl, tp, comment))
    {
        Print("BUY order opened: ", signal, " | Lot: ", lotSize, " | SL: ", sl, " | TP: ", tp);
    }
    else
    {
        Print("Error opening BUY order: ", GetLastError(), " | ", trade.ResultRetcodeDescription());
    }
}

//+------------------------------------------------------------------+
//| Open Sell Trade                                                  |
//+------------------------------------------------------------------+
void OpenSellTrade(string signal)
{
    double bid = SymbolInfoDouble(_Symbol, SYMBOL_BID);
    double point = SymbolInfoDouble(_Symbol, SYMBOL_POINT);
    int digits = (int)SymbolInfoInteger(_Symbol, SYMBOL_DIGITS);
    
    //--- Calculate lot size
    double lotSize = CalculateLotSize(StopLossPoints);
    if(lotSize < SymbolInfoDouble(_Symbol, SYMBOL_VOLUME_MIN))
        lotSize = SymbolInfoDouble(_Symbol, SYMBOL_VOLUME_MIN);
    if(lotSize > MaxLotSize)
        lotSize = MaxLotSize;
    
    //--- Calculate SL and TP
    double sl = 0, tp = 0;
    
    if(StopLossPoints > 0)
        sl = NormalizeDouble(bid + StopLossPoints * point, digits);
    
    if(TakeProfitPoints > 0)
        tp = NormalizeDouble(bid - TakeProfitPoints * point, digits);
    else if(StopLossPoints > 0)
        tp = NormalizeDouble(bid - (StopLossPoints * RiskRewardRatio * point), digits);
    
    //--- Open trade
    string comment = TradeComment + " " + signal;
    
    if(trade.Sell(lotSize, _Symbol, bid, sl, tp, comment))
    {
        Print("SELL order opened: ", signal, " | Lot: ", lotSize, " | SL: ", sl, " | TP: ", tp);
    }
    else
    {
        Print("Error opening SELL order: ", GetLastError(), " | ", trade.ResultRetcodeDescription());
    }
}

//+------------------------------------------------------------------+
//| Calculate lot size based on risk                                 |
//+------------------------------------------------------------------+
double CalculateLotSize(int stopLossPoints)
{
    if(stopLossPoints <= 0)
        return SymbolInfoDouble(_Symbol, SYMBOL_VOLUME_MIN);
    
    double accountBalance = AccountInfoDouble(ACCOUNT_BALANCE);
    double riskAmount = accountBalance * (RiskPercent / 100.0);
    
    double tickSize = SymbolInfoDouble(_Symbol, SYMBOL_TRADE_TICK_SIZE);
    double tickValue = SymbolInfoDouble(_Symbol, SYMBOL_TRADE_TICK_VALUE);
    double point = SymbolInfoDouble(_Symbol, SYMBOL_POINT);
    
    double moneyPerPoint = tickValue / tickSize * point;
    double lotSize = riskAmount / (stopLossPoints * moneyPerPoint);
    
    //--- Normalize lot size
    double minLot = SymbolInfoDouble(_Symbol, SYMBOL_VOLUME_MIN);
    double maxLot = SymbolInfoDouble(_Symbol, SYMBOL_VOLUME_MAX);
    double lotStep = SymbolInfoDouble(_Symbol, SYMBOL_VOLUME_STEP);
    
    lotSize = MathFloor(lotSize / lotStep) * lotStep;
    lotSize = MathMax(lotSize, minLot);
    lotSize = MathMin(lotSize, maxLot);
    
    return lotSize;
}

//+------------------------------------------------------------------+
//| Update trailing stops                                            |
//+------------------------------------------------------------------+
void UpdateTrailingStops()
{
    double point = SymbolInfoDouble(_Symbol, SYMBOL_POINT);
    int digits = (int)SymbolInfoInteger(_Symbol, SYMBOL_DIGITS);
    
    for(int i = PositionsTotal() - 1; i >= 0; i--)
    {
        if(positionInfo.SelectByIndex(i))
        {
            if(positionInfo.Symbol() != _Symbol || positionInfo.Magic() != MagicNumber)
                continue;
            
            double openPrice = positionInfo.PriceOpen();
            double currentSL = positionInfo.StopLoss();
            double currentTP = positionInfo.TakeProfit();
            
            if(positionInfo.Type() == POSITION_TYPE_BUY)
            {
                double bid = SymbolInfoDouble(_Symbol, SYMBOL_BID);
                double newSL = bid - TrailingStopPoints * point;
                
                if(bid > openPrice + TrailingStopPoints * point)
                {
                    if(currentSL < newSL - TrailingStepPoints * point || currentSL == 0)
                    {
                        newSL = NormalizeDouble(newSL, digits);
                        trade.PositionModify(positionInfo.Ticket(), newSL, currentTP);
                        Print("Trailing stop updated for BUY position. New SL: ", newSL);
                    }
                }
            }
            else if(positionInfo.Type() == POSITION_TYPE_SELL)
            {
                double ask = SymbolInfoDouble(_Symbol, SYMBOL_ASK);
                double newSL = ask + TrailingStopPoints * point;
                
                if(ask < openPrice - TrailingStopPoints * point)
                {
                    if(currentSL > newSL + TrailingStepPoints * point || currentSL == 0)
                    {
                        newSL = NormalizeDouble(newSL, digits);
                        trade.PositionModify(positionInfo.Ticket(), newSL, currentTP);
                        Print("Trailing stop updated for SELL position. New SL: ", newSL);
                    }
                }
            }
        }
    }
}

//+------------------------------------------------------------------+
//| Count open trades                                                |
//+------------------------------------------------------------------+
int CountOpenTrades()
{
    int count = 0;
    for(int i = 0; i < PositionsTotal(); i++)
    {
        if(positionInfo.SelectByIndex(i))
        {
            if(positionInfo.Symbol() == _Symbol && positionInfo.Magic() == MagicNumber)
                count++;
        }
    }
    return count;
}

//+------------------------------------------------------------------+
//| Check if in kill zone                                           |
//+------------------------------------------------------------------+
bool IsInKillZone()
{
    MqlDateTime tm;
    TimeCurrent(tm);
    int hour = tm.hour;
    
    // London Kill Zone
    if(hour >= LondonKillZoneStart && hour < LondonKillZoneEnd)
        return true;
    
    // NY Kill Zone
    if(hour >= NYKillZoneStart && hour < NYKillZoneEnd)
        return true;
    
    return false;
}

//+------------------------------------------------------------------+
//| Check daily loss                                                 |
//+------------------------------------------------------------------+
void CheckDailyLoss()
{
    datetime today = iTime(_Symbol, PERIOD_D1, 0);
    
    if(today != lastDayChecked)
    {
        dailyProfit = 0;
        lastDayChecked = today;
    }
    
    //--- Calculate today's profit
    double todayProfit = 0;
    HistorySelect(today, TimeCurrent());
    
    for(int i = 0; i < HistoryDealsTotal(); i++)
    {
        ulong ticket = HistoryDealGetTicket(i);
        if(ticket > 0)
        {
            if(HistoryDealGetString(ticket, DEAL_SYMBOL) == _Symbol &&
               HistoryDealGetInteger(ticket, DEAL_MAGIC) == MagicNumber)
            {
                todayProfit += HistoryDealGetDouble(ticket, DEAL_PROFIT);
            }
        }
    }
    
    double accountBalance = AccountInfoDouble(ACCOUNT_BALANCE);
    dailyProfit = (todayProfit / accountBalance) * 100;
}

//+------------------------------------------------------------------+
//| Clean old order blocks                                           |
//+------------------------------------------------------------------+
void CleanOldOrderBlocks()
{
    datetime currentTime = TimeCurrent();
    int newSize = 0;
    
    for(int i = 0; i < ArraySize(orderBlocks); i++)
    {
        // Keep order blocks from last 100 bars
        if(currentTime - orderBlocks[i].time < PeriodSeconds(_Period) * 100)
        {
            if(newSize != i)
                orderBlocks[newSize] = orderBlocks[i];
            newSize++;
        }
    }
    
    ArrayResize(orderBlocks, newSize);
}

//+------------------------------------------------------------------+
//| Update FVG status                                                |
//+------------------------------------------------------------------+
void UpdateFVGStatus()
{
    double high[], low[];
    ArraySetAsSeries(high, true);
    ArraySetAsSeries(low, true);
    
    CopyHigh(_Symbol, _Period, 0, 10, high);
    CopyLow(_Symbol, _Period, 0, 10, low);
    
    for(int i = 0; i < ArraySize(fvgArray); i++)
    {
        if(!fvgArray[i].isFilled)
        {
            // Check if FVG has been completely filled
            for(int j = 0; j < 10; j++)
            {
                if(fvgArray[i].isBullish)
                {
                    if(low[j] <= fvgArray[i].bottom)
                        fvgArray[i].isFilled = true;
                }
                else
                {
                    if(high[j] >= fvgArray[i].top)
                        fvgArray[i].isFilled = true;
                }
            }
        }
    }
    
    //--- Clean old filled FVGs
    int newSize = 0;
    datetime currentTime = TimeCurrent();
    
    for(int i = 0; i < ArraySize(fvgArray); i++)
    {
        if(!fvgArray[i].isFilled || currentTime - fvgArray[i].time < PeriodSeconds(_Period) * 50)
        {
            if(newSize != i)
                fvgArray[newSize] = fvgArray[i];
            newSize++;
        }
    }
    
    ArrayResize(fvgArray, newSize);
}
//+------------------------------------------------------------------+

