//+------------------------------------------------------------------+
//|                                                  ICT_Beast_EA.mq4 |
//|                                    Advanced ICT Strategy EA       |
//|                                                                    |
//+------------------------------------------------------------------+
#property copyright "EmaScript ICT Beast"
#property link      "https://emascript.com"
#property version   "1.00"
#property strict

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
input int StructureTimeframe = PERIOD_H1;          // Structure timeframe
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
    Print("ICT Beast EA Initialized Successfully!");
    Print("Symbol: ", Symbol());
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
    datetime currentBarTime = iTime(Symbol(), Period(), 0);
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
    int dayOfWeek = DayOfWeek();
    if(!TradeSunday && dayOfWeek == 0)
        return;
    if(!TradeFriday && dayOfWeek == 5 && Hour() >= 20)
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
    double currentPrice = Bid;
    
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
    //--- Count higher highs and higher lows
    int higherHighs = 0, higherLows = 0;
    int lowerHighs = 0, lowerLows = 0;
    
    for(int i = 1; i < SwingPoints; i++)
    {
        double high_current = iHigh(Symbol(), StructureTimeframe, i);
        double high_prev = iHigh(Symbol(), StructureTimeframe, i+1);
        double low_current = iLow(Symbol(), StructureTimeframe, i);
        double low_prev = iLow(Symbol(), StructureTimeframe, i+1);
        
        if(high_current > high_prev) higherHighs++;
        if(high_current < high_prev) lowerHighs++;
        if(low_current > low_prev) higherLows++;
        if(low_current < low_prev) lowerLows++;
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
    int bars = 50;
    
    //--- Find bullish order blocks (down candle followed by strong up move)
    for(int i = 3; i < bars - 3; i++)
    {
        double open_i = iOpen(Symbol(), Period(), i);
        double close_i = iClose(Symbol(), Period(), i);
        double high_i = iHigh(Symbol(), Period(), i);
        double low_i = iLow(Symbol(), Period(), i);
        double close_i1 = iClose(Symbol(), Period(), i-1);
        double close_i2 = iClose(Symbol(), Period(), i-2);
        
        // Bearish candle
        if(close_i < open_i)
        {
            // Followed by bullish move
            if(close_i1 > high_i && close_i1 > close_i2)
            {
                AddOrderBlock(high_i, low_i, iTime(Symbol(), Period(), i), true);
            }
        }
        
        // Bullish candle
        if(close_i > open_i)
        {
            // Followed by bearish move
            if(close_i1 < low_i && close_i1 < close_i2)
            {
                AddOrderBlock(high_i, low_i, iTime(Symbol(), Period(), i), false);
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
    int bars = 50;
    
    //--- Find Fair Value Gaps
    for(int i = 2; i < bars - 1; i++)
    {
        double high_i = iHigh(Symbol(), Period(), i);
        double low_i = iLow(Symbol(), Period(), i);
        double high_i2 = iHigh(Symbol(), Period(), i-2);
        double low_i2 = iLow(Symbol(), Period(), i-2);
        
        // Bullish FVG (gap between candle 3 low and candle 1 high)
        if(low_i2 > high_i)
        {
            double gapSize = (low_i2 - high_i) / Point;
            if(gapSize >= FVG_MinPoints)
            {
                AddFVG(low_i2, high_i, iTime(Symbol(), Period(), i), true);
            }
        }
        
        // Bearish FVG (gap between candle 3 high and candle 1 low)
        if(high_i2 < low_i)
        {
            double gapSize = (low_i - high_i2) / Point;
            if(gapSize >= FVG_MinPoints)
            {
                AddFVG(low_i, high_i2, iTime(Symbol(), Period(), i), false);
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
    for(int i = 0; i < ArraySize(orderBlocks); i++)
    {
        if(orderBlocks[i].isBullish && orderBlocks[i].isValid)
        {
            // Check if price is in the order block zone
            if(Bid >= orderBlocks[i].low && Bid <= orderBlocks[i].high)
            {
                // Check OTE levels (0.62-0.79 retracement)
                double range = orderBlocks[i].high - orderBlocks[i].low;
                double ote_low = orderBlocks[i].low + (range * OTE_FibLow);
                double ote_high = orderBlocks[i].low + (range * OTE_FibHigh);
                
                if(Bid >= ote_low && Bid <= ote_high)
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
    for(int i = 0; i < ArraySize(orderBlocks); i++)
    {
        if(!orderBlocks[i].isBullish && orderBlocks[i].isValid)
        {
            // Check if price is in the order block zone
            if(Bid >= orderBlocks[i].low && Bid <= orderBlocks[i].high)
            {
                // Check OTE levels
                double range = orderBlocks[i].high - orderBlocks[i].low;
                double ote_low = orderBlocks[i].high - (range * OTE_FibHigh);
                double ote_high = orderBlocks[i].high - (range * OTE_FibLow);
                
                if(Bid >= ote_low && Bid <= ote_high)
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
    for(int i = 0; i < ArraySize(fvgArray); i++)
    {
        if(fvgArray[i].isBullish && !fvgArray[i].isFilled)
        {
            // Price entered the FVG zone
            if(Bid >= fvgArray[i].bottom && Bid <= fvgArray[i].top)
            {
                // Look for 50% fill (optimal entry)
                double midpoint = (fvgArray[i].top + fvgArray[i].bottom) / 2;
                if(Bid <= midpoint + (fvgArray[i].top - fvgArray[i].bottom) * 0.2 &&
                   Bid >= midpoint - (fvgArray[i].top - fvgArray[i].bottom) * 0.2)
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
    for(int i = 0; i < ArraySize(fvgArray); i++)
    {
        if(!fvgArray[i].isBullish && !fvgArray[i].isFilled)
        {
            if(Bid >= fvgArray[i].bottom && Bid <= fvgArray[i].top)
            {
                double midpoint = (fvgArray[i].top + fvgArray[i].bottom) / 2;
                if(Bid <= midpoint + (fvgArray[i].top - fvgArray[i].bottom) * 0.2 &&
                   Bid >= midpoint - (fvgArray[i].top - fvgArray[i].bottom) * 0.2)
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
    double lotSize = CalculateLotSize(StopLossPoints);
    if(lotSize < MarketInfo(Symbol(), MODE_MINLOT))
        lotSize = MarketInfo(Symbol(), MODE_MINLOT);
    if(lotSize > MaxLotSize)
        lotSize = MaxLotSize;
    
    //--- Calculate SL and TP
    double sl = 0, tp = 0;
    
    if(StopLossPoints > 0)
        sl = NormalizeDouble(Ask - StopLossPoints * Point, Digits);
    
    if(TakeProfitPoints > 0)
        tp = NormalizeDouble(Ask + TakeProfitPoints * Point, Digits);
    else if(StopLossPoints > 0)
        tp = NormalizeDouble(Ask + (StopLossPoints * RiskRewardRatio * Point), Digits);
    
    //--- Open trade
    string comment = TradeComment + " " + signal;
    int ticket = OrderSend(Symbol(), OP_BUY, lotSize, Ask, 3, sl, tp, comment, MagicNumber, 0, clrGreen);
    
    if(ticket > 0)
    {
        Print("BUY order opened: ", signal, " | Ticket: ", ticket, " | Lot: ", lotSize, " | SL: ", sl, " | TP: ", tp);
    }
    else
    {
        Print("Error opening BUY order: ", GetLastError());
    }
}

//+------------------------------------------------------------------+
//| Open Sell Trade                                                  |
//+------------------------------------------------------------------+
void OpenSellTrade(string signal)
{
    double lotSize = CalculateLotSize(StopLossPoints);
    if(lotSize < MarketInfo(Symbol(), MODE_MINLOT))
        lotSize = MarketInfo(Symbol(), MODE_MINLOT);
    if(lotSize > MaxLotSize)
        lotSize = MaxLotSize;
    
    //--- Calculate SL and TP
    double sl = 0, tp = 0;
    
    if(StopLossPoints > 0)
        sl = NormalizeDouble(Bid + StopLossPoints * Point, Digits);
    
    if(TakeProfitPoints > 0)
        tp = NormalizeDouble(Bid - TakeProfitPoints * Point, Digits);
    else if(StopLossPoints > 0)
        tp = NormalizeDouble(Bid - (StopLossPoints * RiskRewardRatio * Point), Digits);
    
    //--- Open trade
    string comment = TradeComment + " " + signal;
    int ticket = OrderSend(Symbol(), OP_SELL, lotSize, Bid, 3, sl, tp, comment, MagicNumber, 0, clrRed);
    
    if(ticket > 0)
    {
        Print("SELL order opened: ", signal, " | Ticket: ", ticket, " | Lot: ", lotSize, " | SL: ", sl, " | TP: ", tp);
    }
    else
    {
        Print("Error opening SELL order: ", GetLastError());
    }
}

//+------------------------------------------------------------------+
//| Calculate lot size based on risk                                 |
//+------------------------------------------------------------------+
double CalculateLotSize(int stopLossPoints)
{
    if(stopLossPoints <= 0)
        return MarketInfo(Symbol(), MODE_MINLOT);
    
    double accountBalance = AccountBalance();
    double riskAmount = accountBalance * (RiskPercent / 100.0);
    
    double tickValue = MarketInfo(Symbol(), MODE_TICKVALUE);
    double tickSize = MarketInfo(Symbol(), MODE_TICKSIZE);
    
    double moneyPerPoint = tickValue / tickSize * Point;
    double lotSize = riskAmount / (stopLossPoints * moneyPerPoint);
    
    //--- Normalize lot size
    double minLot = MarketInfo(Symbol(), MODE_MINLOT);
    double maxLot = MarketInfo(Symbol(), MODE_MAXLOT);
    double lotStep = MarketInfo(Symbol(), MODE_LOTSTEP);
    
    lotSize = MathFloor(lotSize / lotStep) * lotStep;
    lotSize = MathMax(lotSize, minLot);
    lotSize = MathMin(lotSize, maxLot);
    
    return NormalizeDouble(lotSize, 2);
}

//+------------------------------------------------------------------+
//| Update trailing stops                                            |
//+------------------------------------------------------------------+
void UpdateTrailingStops()
{
    for(int i = OrdersTotal() - 1; i >= 0; i--)
    {
        if(!OrderSelect(i, SELECT_BY_POS, MODE_TRADES))
            continue;
        
        if(OrderSymbol() != Symbol() || OrderMagicNumber() != MagicNumber)
            continue;
        
        double openPrice = OrderOpenPrice();
        double currentSL = OrderStopLoss();
        double currentTP = OrderTakeProfit();
        
        if(OrderType() == OP_BUY)
        {
            double newSL = Bid - TrailingStopPoints * Point;
            
            if(Bid > openPrice + TrailingStopPoints * Point)
            {
                if(currentSL < newSL - TrailingStepPoints * Point || currentSL == 0)
                {
                    newSL = NormalizeDouble(newSL, Digits);
                    bool modified = OrderModify(OrderTicket(), OrderOpenPrice(), newSL, currentTP, 0, clrBlue);
                    if(modified)
                        Print("Trailing stop updated for BUY position. New SL: ", newSL);
                }
            }
        }
        else if(OrderType() == OP_SELL)
        {
            double newSL = Ask + TrailingStopPoints * Point;
            
            if(Ask < openPrice - TrailingStopPoints * Point)
            {
                if(currentSL > newSL + TrailingStepPoints * Point || currentSL == 0)
                {
                    newSL = NormalizeDouble(newSL, Digits);
                    bool modified = OrderModify(OrderTicket(), OrderOpenPrice(), newSL, currentTP, 0, clrBlue);
                    if(modified)
                        Print("Trailing stop updated for SELL position. New SL: ", newSL);
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
    for(int i = 0; i < OrdersTotal(); i++)
    {
        if(OrderSelect(i, SELECT_BY_POS, MODE_TRADES))
        {
            if(OrderSymbol() == Symbol() && OrderMagicNumber() == MagicNumber)
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
    int hour = Hour();
    
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
    datetime today = iTime(Symbol(), PERIOD_D1, 0);
    
    if(today != lastDayChecked)
    {
        dailyProfit = 0;
        lastDayChecked = today;
    }
    
    //--- Calculate today's profit
    double todayProfit = 0;
    
    for(int i = OrdersHistoryTotal() - 1; i >= 0; i--)
    {
        if(!OrderSelect(i, SELECT_BY_POS, MODE_HISTORY))
            continue;
        
        if(OrderSymbol() == Symbol() && OrderMagicNumber() == MagicNumber)
        {
            if(OrderCloseTime() >= today)
            {
                todayProfit += OrderProfit() + OrderSwap() + OrderCommission();
            }
        }
    }
    
    double accountBalance = AccountBalance();
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
        if(currentTime - orderBlocks[i].time < PeriodSeconds() * 100)
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
    for(int i = 0; i < ArraySize(fvgArray); i++)
    {
        if(!fvgArray[i].isFilled)
        {
            // Check if FVG has been completely filled
            for(int j = 0; j < 10; j++)
            {
                double high_j = iHigh(Symbol(), Period(), j);
                double low_j = iLow(Symbol(), Period(), j);
                
                if(fvgArray[i].isBullish)
                {
                    if(low_j <= fvgArray[i].bottom)
                        fvgArray[i].isFilled = true;
                }
                else
                {
                    if(high_j >= fvgArray[i].top)
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
        if(!fvgArray[i].isFilled || currentTime - fvgArray[i].time < PeriodSeconds() * 50)
        {
            if(newSize != i)
                fvgArray[newSize] = fvgArray[i];
            newSize++;
        }
    }
    
    ArrayResize(fvgArray, newSize);
}
//+------------------------------------------------------------------+

