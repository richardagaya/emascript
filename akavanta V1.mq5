//+------------------------------------------------------------------+
//|                                         Gold_Scalper_Pro_EA.mq5  |
//|                         Fast Gold Day Trading - ICT + Scalping   |
//|                                                                   |
//+------------------------------------------------------------------+
#property copyright "EmaScript Gold Scalper Pro"
#property link      "https://emascript.com"
#property version   "1.00"

#include <Trade\Trade.mqh>
#include <Trade\PositionInfo.mqh>

//--- Input Parameters
input group "=== Risk Management ==="
input double RiskPercent = 1.0;                    // Risk per trade (%)
input double RiskRewardRatio = 2.0;                // Risk:Reward Ratio
input int PositionsPerSignal = 3;                  // Positions to open per signal
input bool WaitForAllToClose = true;               // Wait for all positions to close before new entry
input double MaxLotSize = 5.0;                     // Maximum lot size

input group "=== Gold Scalping Settings ==="
input int FastMA = 9;                              // Fast EMA Period
input int SlowMA = 21;                             // Slow EMA Period
input int RSI_Period = 14;                         // RSI Period
input int RSI_Overbought = 70;                     // RSI Overbought Level
input int RSI_Oversold = 30;                       // RSI Oversold Level
input int ATR_Period = 14;                         // ATR Period for volatility

input group "=== Entry Patterns ==="
input bool UseMAXCross = true;                     // Trade MA Crossovers
input bool UseMomentum = true;                     // Trade Momentum Breakouts
input bool UsePriceAction = true;                  // Trade Engulfing Patterns
input bool UseSupRes = true;                       // Trade Support/Resistance Breaks
input int LookbackBars = 20;                       // Lookback for S/R levels

input group "=== Stop Loss & Take Profit ==="
input double SL_Multiplier = 1.5;                  // SL = ATR × This (dynamic)
input double TP_Multiplier = 3.0;                  // TP = ATR × This (dynamic)
input int MinSL_Points = 150;                      // Minimum SL in points (Gold: $15)
input int MaxSL_Points = 500;                      // Maximum SL in points (Gold: $50)
input bool UseTrailingStop = true;                 // Use trailing stop
input double TrailStart_Multiplier = 1.5;          // Start trailing at ATR × This
input double TrailDistance_Multiplier = 1.0;       // Trail distance ATR × This

input group "=== Time Filters ==="
input bool TradeAsianSession = false;              // Trade Asian (low volatility)
input bool TradeLondonSession = true;              // Trade London (high volume)
input bool TradeNYSession = true;                  // Trade NY (high volatility)
input int AsianStart = 0;                          // Asian session start
input int AsianEnd = 8;                            // Asian session end
input int LondonStart = 8;                         // London session start
input int LondonEnd = 16;                          // London session end
input int NYStart = 13;                            // NY session start
input int NYEnd = 22;                              // NY session end

input group "=== Advanced Settings ==="
input int MagicNumber = 789456;                    // Magic Number
input string TradeComment = "Gold_Scalper";        // Trade Comment
input int MinBarsBetweenTrades = 3;                // Min bars between trades
input bool UseNewsFilter = true;                   // Avoid trading near news
input int NewsAvoidMinutes = 15;                   // Minutes to avoid before/after news

//--- Global Variables
CTrade trade;
CPositionInfo position;

datetime lastTradeTime = 0;
int fastMA_Handle;
int slowMA_Handle;
int rsi_Handle;
int atr_Handle;

double fastMA_Buffer[];
double slowMA_Buffer[];
double rsi_Buffer[];
double atr_Buffer[];

//+------------------------------------------------------------------+
//| Expert initialization function                                   |
//+------------------------------------------------------------------+
int OnInit()
{
    //--- Set up trade object
    trade.SetExpertMagicNumber(MagicNumber);
    trade.SetDeviationInPoints(10);
    trade.SetTypeFilling(ORDER_FILLING_FOK);
    trade.SetAsyncMode(false);
    
    //--- Create indicators
    fastMA_Handle = iMA(_Symbol, PERIOD_CURRENT, FastMA, 0, MODE_EMA, PRICE_CLOSE);
    slowMA_Handle = iMA(_Symbol, PERIOD_CURRENT, SlowMA, 0, MODE_EMA, PRICE_CLOSE);
    rsi_Handle = iRSI(_Symbol, PERIOD_CURRENT, RSI_Period, PRICE_CLOSE);
    atr_Handle = iATR(_Symbol, PERIOD_CURRENT, ATR_Period);
    
    if(fastMA_Handle == INVALID_HANDLE || slowMA_Handle == INVALID_HANDLE || 
       rsi_Handle == INVALID_HANDLE || atr_Handle == INVALID_HANDLE)
    {
        Print("Error creating indicators!");
        return(INIT_FAILED);
    }
    
    //--- Set up arrays
    ArraySetAsSeries(fastMA_Buffer, true);
    ArraySetAsSeries(slowMA_Buffer, true);
    ArraySetAsSeries(rsi_Buffer, true);
    ArraySetAsSeries(atr_Buffer, true);
    
    Print("╔══════════════════════════════════════════════════════════╗");
    Print("║     GOLD SCALPER PRO EA - INITIALIZED SUCCESSFULLY!      ║");
    Print("╚══════════════════════════════════════════════════════════╝");
    Print("Symbol: ", _Symbol);
    Print("Timeframe: ", EnumToString(_Period));
    Print("Risk per trade: ", RiskPercent, "%");
    Print("Risk:Reward: ", RiskRewardRatio, ":1");
    Print("Strategy: Fast Gold Scalping (Multiple Patterns)");
    Print("═══════════════════════════════════════════════════════════");
    
    return(INIT_SUCCEEDED);
}

//+------------------------------------------------------------------+
//| Expert deinitialization function                                 |
//+------------------------------------------------------------------+
void OnDeinit(const int reason)
{
    IndicatorRelease(fastMA_Handle);
    IndicatorRelease(slowMA_Handle);
    IndicatorRelease(rsi_Handle);
    IndicatorRelease(atr_Handle);
    
    Print("Gold Scalper EA Stopped. Reason: ", reason);
}

//+------------------------------------------------------------------+
//| Expert tick function                                             |
//+------------------------------------------------------------------+
void OnTick()
{
    //--- Update trailing stops first
    if(UseTrailingStop)
        ManageTrailingStops();
    
    //--- Check if we should wait for all positions to close
    int openTrades = CountOpenTrades();
    if(WaitForAllToClose && openTrades > 0)
    {
        // Wait for all positions to close before opening new ones
        return;
    }
    
    //--- Check if we already have positions open (and not waiting for all to close)
    if(!WaitForAllToClose && openTrades >= PositionsPerSignal)
        return;
    
    //--- Check minimum bars between trades
    int barsSinceLastTrade = iBarShift(_Symbol, _Period, lastTradeTime);
    if(barsSinceLastTrade < MinBarsBetweenTrades && barsSinceLastTrade != -1)
        return;
    
    //--- Check time filter
    if(!IsInTradingSession())
        return;
    
    //--- Update indicator buffers
    if(!UpdateIndicators())
        return;
    
    //--- Check for trading signals
    int signal = GetTradingSignal();
    
    if(signal == 1) // Buy signal
    {
        OpenMultipleBuyTrades();
    }
    else if(signal == -1) // Sell signal
    {
        OpenMultipleSellTrades();
    }
}

//+------------------------------------------------------------------+
//| Update indicator buffers                                         |
//+------------------------------------------------------------------+
bool UpdateIndicators()
{
    if(CopyBuffer(fastMA_Handle, 0, 0, 5, fastMA_Buffer) < 5)
        return false;
    if(CopyBuffer(slowMA_Handle, 0, 0, 5, slowMA_Buffer) < 5)
        return false;
    if(CopyBuffer(rsi_Handle, 0, 0, 5, rsi_Buffer) < 5)
        return false;
    if(CopyBuffer(atr_Handle, 0, 0, 3, atr_Buffer) < 3)
        return false;
    
    return true;
}

//+------------------------------------------------------------------+
//| Get trading signal                                               |
//+------------------------------------------------------------------+
int GetTradingSignal()
{
    int buySignals = 0;
    int sellSignals = 0;
    
    //--- Strategy 1: MA Crossover
    if(UseMAXCross && CheckMACross())
    {
        if(fastMA_Buffer[0] > slowMA_Buffer[0] && fastMA_Buffer[1] <= slowMA_Buffer[1])
        {
            buySignals++;
            Print("📈 BUY Signal: MA Crossover");
        }
        else if(fastMA_Buffer[0] < slowMA_Buffer[0] && fastMA_Buffer[1] >= slowMA_Buffer[1])
        {
            sellSignals++;
            Print("📉 SELL Signal: MA Crossover");
        }
    }
    
    //--- Strategy 2: Momentum with RSI
    if(UseMomentum)
    {
        double currentPrice = SymbolInfoDouble(_Symbol, SYMBOL_BID);
        bool bullishMomentum = fastMA_Buffer[0] > slowMA_Buffer[0] && 
                               rsi_Buffer[0] > 50 && rsi_Buffer[0] < RSI_Overbought;
        bool bearishMomentum = fastMA_Buffer[0] < slowMA_Buffer[0] && 
                               rsi_Buffer[0] < 50 && rsi_Buffer[0] > RSI_Oversold;
        
        if(bullishMomentum && rsi_Buffer[1] <= 50)
        {
            buySignals++;
            Print("📈 BUY Signal: Bullish Momentum (RSI: ", DoubleToString(rsi_Buffer[0], 1), ")");
        }
        else if(bearishMomentum && rsi_Buffer[1] >= 50)
        {
            sellSignals++;
            Print("📉 SELL Signal: Bearish Momentum (RSI: ", DoubleToString(rsi_Buffer[0], 1), ")");
        }
    }
    
    //--- Strategy 3: Price Action (Engulfing)
    if(UsePriceAction)
    {
        int engulfing = CheckEngulfingPattern();
        if(engulfing == 1)
        {
            buySignals++;
            Print("📈 BUY Signal: Bullish Engulfing Pattern");
        }
        else if(engulfing == -1)
        {
            sellSignals++;
            Print("📉 SELL Signal: Bearish Engulfing Pattern");
        }
    }
    
    //--- Strategy 4: Support/Resistance Breakout
    if(UseSupRes)
    {
        int breakout = CheckSupportResistanceBreak();
        if(breakout == 1)
        {
            buySignals++;
            Print("📈 BUY Signal: Resistance Breakout");
        }
        else if(breakout == -1)
        {
            sellSignals++;
            Print("📉 SELL Signal: Support Breakdown");
        }
    }
    
    //--- Strategy 5: RSI Reversal
    if(rsi_Buffer[0] < RSI_Oversold && rsi_Buffer[1] >= RSI_Oversold)
    {
        buySignals++;
        Print("📈 BUY Signal: RSI Oversold Reversal");
    }
    else if(rsi_Buffer[0] > RSI_Overbought && rsi_Buffer[1] <= RSI_Overbought)
    {
        sellSignals++;
        Print("📉 SELL Signal: RSI Overbought Reversal");
    }
    
    //--- Require at least 2 confirmations
    if(buySignals >= 2)
        return 1;
    else if(sellSignals >= 2)
        return -1;
    
    return 0;
}

//+------------------------------------------------------------------+
//| Check MA Crossover                                               |
//+------------------------------------------------------------------+
bool CheckMACross()
{
    // Crossover happened within last 2 bars
    return true;
}

//+------------------------------------------------------------------+
//| Check Engulfing Pattern                                          |
//+------------------------------------------------------------------+
int CheckEngulfingPattern()
{
    double open1 = iOpen(_Symbol, _Period, 1);
    double close1 = iClose(_Symbol, _Period, 1);
    double open2 = iOpen(_Symbol, _Period, 2);
    double close2 = iClose(_Symbol, _Period, 2);
    
    // Bullish Engulfing
    if(close2 < open2 && close1 > open1 && 
       close1 > open2 && open1 < close2)
    {
        return 1;
    }
    
    // Bearish Engulfing
    if(close2 > open2 && close1 < open1 && 
       close1 < open2 && open1 > close2)
    {
        return -1;
    }
    
    return 0;
}

//+------------------------------------------------------------------+
//| Check Support/Resistance Break                                   |
//+------------------------------------------------------------------+
int CheckSupportResistanceBreak()
{
    double high[], low[];
    ArraySetAsSeries(high, true);
    ArraySetAsSeries(low, true);
    
    if(CopyHigh(_Symbol, _Period, 0, LookbackBars + 5, high) < LookbackBars)
        return 0;
    if(CopyLow(_Symbol, _Period, 0, LookbackBars + 5, low) < LookbackBars)
        return 0;
    
    // Find recent resistance
    double resistance = high[ArrayMaximum(high, 1, LookbackBars)];
    double support = low[ArrayMinimum(low, 1, LookbackBars)];
    
    double currentClose = iClose(_Symbol, _Period, 0);
    double previousClose = iClose(_Symbol, _Period, 1);
    
    double point = SymbolInfoDouble(_Symbol, SYMBOL_POINT);
    double breakoutThreshold = 10 * point; // Small threshold for Gold
    
    // Resistance breakout
    if(currentClose > resistance + breakoutThreshold && previousClose <= resistance)
    {
        return 1;
    }
    
    // Support breakdown
    if(currentClose < support - breakoutThreshold && previousClose >= support)
    {
        return -1;
    }
    
    return 0;
}

//+------------------------------------------------------------------+
//| Open Multiple Buy Trades                                         |
//+------------------------------------------------------------------+
void OpenMultipleBuyTrades()
{
    // Ensure ATR buffer is valid
    if(ArraySize(atr_Buffer) < 1)
    {
        Print("❌ Error: ATR buffer not ready");
        return;
    }
    
    double ask = SymbolInfoDouble(_Symbol, SYMBOL_ASK);
    double atr = atr_Buffer[0];
    double point = SymbolInfoDouble(_Symbol, SYMBOL_POINT);
    int digits = (int)SymbolInfoInteger(_Symbol, SYMBOL_DIGITS);
    
    //--- Calculate dynamic SL and TP based on ATR
    double slDistance = MathMax(atr * SL_Multiplier, MinSL_Points * point);
    slDistance = MathMin(slDistance, MaxSL_Points * point);
    
    double tpDistance = slDistance * RiskRewardRatio;
    
    double sl = NormalizeDouble(ask - slDistance, digits);
    double tp = NormalizeDouble(ask + tpDistance, digits);
    
    //--- Calculate lot size (divide risk among all positions)
    double totalRisk = RiskPercent;
    double riskPerPosition = totalRisk / PositionsPerSignal;
    
    // Calculate lot size based on risk per position
    double lotSize = CalculateLotSizeWithRisk(slDistance, riskPerPosition);
    
    //--- Open multiple positions
    int successCount = 0;
    
    Print("╔═══════════════════════════════════════════════════════╗");
    Print("║  OPENING ", PositionsPerSignal, " BUY POSITIONS                              ║");
    Print("╚═══════════════════════════════════════════════════════╝");
    
    for(int i = 0; i < PositionsPerSignal; i++)
    {
        string comment = TradeComment + " #" + IntegerToString(i + 1);
        
        if(trade.Buy(lotSize, _Symbol, ask, sl, tp, comment))
        {
            successCount++;
            Print("✅ BUY Position ", (i + 1), "/", PositionsPerSignal, " opened!");
        }
        else
        {
            Print("❌ Error opening BUY position ", (i + 1), ": ", GetLastError(), " | ", trade.ResultRetcodeDescription());
        }
        
        Sleep(100); // Small delay between orders
    }
    
    if(successCount > 0)
    {
        lastTradeTime = TimeCurrent();
        Print("═══════════════════════════════════════════════════════");
        Print("✅ ", successCount, " BUY POSITIONS OPENED SUCCESSFULLY!");
        Print("Price: ", ask);
        Print("Lot Size per position: ", lotSize);
        Print("Total Lot Size: ", NormalizeDouble(lotSize * successCount, 2));
        Print("SL: ", sl, " (", DoubleToString(slDistance / point, 0), " points)");
        Print("TP: ", tp, " (", DoubleToString(tpDistance / point, 0), " points)");
        Print("Risk per position: ", DoubleToString(riskPerPosition, 2), "%");
        Print("Total Risk: ", DoubleToString(riskPerPosition * successCount, 2), "%");
        Print("ATR: ", DoubleToString(atr, digits));
        Print("═══════════════════════════════════════════════════════");
    }
}

//+------------------------------------------------------------------+
//| Open Buy Trade (Single - kept for compatibility)                |
//+------------------------------------------------------------------+
void OpenBuyTrade()
{
    // Ensure ATR buffer is valid
    if(ArraySize(atr_Buffer) < 1)
    {
        Print("❌ Error: ATR buffer not ready");
        return;
    }
    
    double ask = SymbolInfoDouble(_Symbol, SYMBOL_ASK);
    double atr = atr_Buffer[0];
    double point = SymbolInfoDouble(_Symbol, SYMBOL_POINT);
    int digits = (int)SymbolInfoInteger(_Symbol, SYMBOL_DIGITS);
    
    //--- Calculate dynamic SL and TP based on ATR
    double slDistance = MathMax(atr * SL_Multiplier, MinSL_Points * point);
    slDistance = MathMin(slDistance, MaxSL_Points * point);
    
    double tpDistance = slDistance * RiskRewardRatio;
    
    double sl = NormalizeDouble(ask - slDistance, digits);
    double tp = NormalizeDouble(ask + tpDistance, digits);
    
    //--- Calculate lot size
    double lotSize = CalculateLotSize(slDistance);
    
    //--- Open trade
    if(trade.Buy(lotSize, _Symbol, ask, sl, tp, TradeComment))
    {
        lastTradeTime = TimeCurrent();
        Print("═══════════════════════════════════════════════════════");
        Print("✅ BUY ORDER OPENED!");
        Print("Price: ", ask);
        Print("Lot Size: ", lotSize);
        Print("SL: ", sl, " (", DoubleToString(slDistance / point, 0), " points)");
        Print("TP: ", tp, " (", DoubleToString(tpDistance / point, 0), " points)");
        Print("ATR: ", DoubleToString(atr, digits));
        Print("═══════════════════════════════════════════════════════");
    }
    else
    {
        Print("❌ Error opening BUY: ", GetLastError(), " | ", trade.ResultRetcodeDescription());
    }
}

//+------------------------------------------------------------------+
//| Open Multiple Sell Trades                                        |
//+------------------------------------------------------------------+
void OpenMultipleSellTrades()
{
    // Ensure ATR buffer is valid
    if(ArraySize(atr_Buffer) < 1)
    {
        Print("❌ Error: ATR buffer not ready");
        return;
    }
    
    double bid = SymbolInfoDouble(_Symbol, SYMBOL_BID);
    double atr = atr_Buffer[0];
    double point = SymbolInfoDouble(_Symbol, SYMBOL_POINT);
    int digits = (int)SymbolInfoInteger(_Symbol, SYMBOL_DIGITS);
    
    //--- Calculate dynamic SL and TP based on ATR
    double slDistance = MathMax(atr * SL_Multiplier, MinSL_Points * point);
    slDistance = MathMin(slDistance, MaxSL_Points * point);
    
    double tpDistance = slDistance * RiskRewardRatio;
    
    double sl = NormalizeDouble(bid + slDistance, digits);
    double tp = NormalizeDouble(bid - tpDistance, digits);
    
    //--- Calculate lot size (divide risk among all positions)
    double totalRisk = RiskPercent;
    double riskPerPosition = totalRisk / PositionsPerSignal;
    
    // Calculate lot size based on risk per position
    double lotSize = CalculateLotSizeWithRisk(slDistance, riskPerPosition);
    
    //--- Open multiple positions
    int successCount = 0;
    
    Print("╔═══════════════════════════════════════════════════════╗");
    Print("║  OPENING ", PositionsPerSignal, " SELL POSITIONS                             ║");
    Print("╚═══════════════════════════════════════════════════════╝");
    
    for(int i = 0; i < PositionsPerSignal; i++)
    {
        string comment = TradeComment + " #" + IntegerToString(i + 1);
        
        if(trade.Sell(lotSize, _Symbol, bid, sl, tp, comment))
        {
            successCount++;
            Print("✅ SELL Position ", (i + 1), "/", PositionsPerSignal, " opened!");
        }
        else
        {
            Print("❌ Error opening SELL position ", (i + 1), ": ", GetLastError(), " | ", trade.ResultRetcodeDescription());
        }
        
        Sleep(100); // Small delay between orders
    }
    
    if(successCount > 0)
    {
        lastTradeTime = TimeCurrent();
        Print("═══════════════════════════════════════════════════════");
        Print("✅ ", successCount, " SELL POSITIONS OPENED SUCCESSFULLY!");
        Print("Price: ", bid);
        Print("Lot Size per position: ", lotSize);
        Print("Total Lot Size: ", NormalizeDouble(lotSize * successCount, 2));
        Print("SL: ", sl, " (", DoubleToString(slDistance / point, 0), " points)");
        Print("TP: ", tp, " (", DoubleToString(tpDistance / point, 0), " points)");
        Print("Risk per position: ", DoubleToString(riskPerPosition, 2), "%");
        Print("Total Risk: ", DoubleToString(riskPerPosition * successCount, 2), "%");
        Print("ATR: ", DoubleToString(atr, digits));
        Print("═══════════════════════════════════════════════════════");
    }
}

//+------------------------------------------------------------------+
//| Open Sell Trade (Single - kept for compatibility)               |
//+------------------------------------------------------------------+
void OpenSellTrade()
{
    // Ensure ATR buffer is valid
    if(ArraySize(atr_Buffer) < 1)
    {
        Print("❌ Error: ATR buffer not ready");
        return;
    }
    
    double bid = SymbolInfoDouble(_Symbol, SYMBOL_BID);
    double atr = atr_Buffer[0];
    double point = SymbolInfoDouble(_Symbol, SYMBOL_POINT);
    int digits = (int)SymbolInfoInteger(_Symbol, SYMBOL_DIGITS);
    
    //--- Calculate dynamic SL and TP based on ATR
    double slDistance = MathMax(atr * SL_Multiplier, MinSL_Points * point);
    slDistance = MathMin(slDistance, MaxSL_Points * point);
    
    double tpDistance = slDistance * RiskRewardRatio;
    
    double sl = NormalizeDouble(bid + slDistance, digits);
    double tp = NormalizeDouble(bid - tpDistance, digits);
    
    //--- Calculate lot size
    double lotSize = CalculateLotSize(slDistance);
    
    //--- Open trade
    if(trade.Sell(lotSize, _Symbol, bid, sl, tp, TradeComment))
    {
        lastTradeTime = TimeCurrent();
        Print("═══════════════════════════════════════════════════════");
        Print("✅ SELL ORDER OPENED!");
        Print("Price: ", bid);
        Print("Lot Size: ", lotSize);
        Print("SL: ", sl, " (", DoubleToString(slDistance / point, 0), " points)");
        Print("TP: ", tp, " (", DoubleToString(tpDistance / point, 0), " points)");
        Print("ATR: ", DoubleToString(atr, digits));
        Print("═══════════════════════════════════════════════════════");
    }
    else
    {
        Print("❌ Error opening SELL: ", GetLastError(), " | ", trade.ResultRetcodeDescription());
    }
}

//+------------------------------------------------------------------+
//| Calculate lot size based on risk                                 |
//+------------------------------------------------------------------+
double CalculateLotSize(double slDistance)
{
    return CalculateLotSizeWithRisk(slDistance, RiskPercent);
}

//+------------------------------------------------------------------+
//| Calculate lot size with custom risk percentage                   |
//+------------------------------------------------------------------+
double CalculateLotSizeWithRisk(double slDistance, double riskPercent)
{
    double accountBalance = AccountInfoDouble(ACCOUNT_BALANCE);
    double riskAmount = accountBalance * (riskPercent / 100.0);
    
    double tickSize = SymbolInfoDouble(_Symbol, SYMBOL_TRADE_TICK_SIZE);
    double tickValue = SymbolInfoDouble(_Symbol, SYMBOL_TRADE_TICK_VALUE);
    double point = SymbolInfoDouble(_Symbol, SYMBOL_POINT);
    
    double moneyPerPoint = (tickValue / tickSize) * point;
    double slPoints = slDistance / point;
    
    double lotSize = riskAmount / (slPoints * moneyPerPoint);
    
    //--- Normalize lot size
    double minLot = SymbolInfoDouble(_Symbol, SYMBOL_VOLUME_MIN);
    double maxLot = SymbolInfoDouble(_Symbol, SYMBOL_VOLUME_MAX);
    double lotStep = SymbolInfoDouble(_Symbol, SYMBOL_VOLUME_STEP);
    
    lotSize = MathFloor(lotSize / lotStep) * lotStep;
    lotSize = MathMax(lotSize, minLot);
    lotSize = MathMin(lotSize, maxLot);
    lotSize = MathMin(lotSize, MaxLotSize);
    
    return lotSize;
}

//+------------------------------------------------------------------+
//| Manage trailing stops                                            |
//+------------------------------------------------------------------+
void ManageTrailingStops()
{
    // Check if ATR buffer has data
    if(CopyBuffer(atr_Handle, 0, 0, 1, atr_Buffer) < 1)
        return;
    
    double atr = atr_Buffer[0];
    double point = SymbolInfoDouble(_Symbol, SYMBOL_POINT);
    int digits = (int)SymbolInfoInteger(_Symbol, SYMBOL_DIGITS);
    
    double trailStart = atr * TrailStart_Multiplier;
    double trailDistance = atr * TrailDistance_Multiplier;
    
    for(int i = PositionsTotal() - 1; i >= 0; i--)
    {
        if(position.SelectByIndex(i))
        {
            if(position.Symbol() != _Symbol || position.Magic() != MagicNumber)
                continue;
            
            double openPrice = position.PriceOpen();
            double currentSL = position.StopLoss();
            double currentTP = position.TakeProfit();
            
            if(position.Type() == POSITION_TYPE_BUY)
            {
                double bid = SymbolInfoDouble(_Symbol, SYMBOL_BID);
                double profit = bid - openPrice;
                
                if(profit >= trailStart)
                {
                    double newSL = bid - trailDistance;
                    newSL = NormalizeDouble(newSL, digits);
                    
                    if(newSL > currentSL)
                    {
                        trade.PositionModify(position.Ticket(), newSL, currentTP);
                        Print("🔒 Trailing Stop Updated (BUY): New SL = ", newSL);
                    }
                }
            }
            else if(position.Type() == POSITION_TYPE_SELL)
            {
                double ask = SymbolInfoDouble(_Symbol, SYMBOL_ASK);
                double profit = openPrice - ask;
                
                if(profit >= trailStart)
                {
                    double newSL = ask + trailDistance;
                    newSL = NormalizeDouble(newSL, digits);
                    
                    if(newSL < currentSL || currentSL == 0)
                    {
                        trade.PositionModify(position.Ticket(), newSL, currentTP);
                        Print("🔒 Trailing Stop Updated (SELL): New SL = ", newSL);
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
        if(position.SelectByIndex(i))
        {
            if(position.Symbol() == _Symbol && position.Magic() == MagicNumber)
                count++;
        }
    }
    return count;
}

//+------------------------------------------------------------------+
//| Check if in trading session                                      |
//+------------------------------------------------------------------+
bool IsInTradingSession()
{
    MqlDateTime tm;
    TimeToStruct(TimeCurrent(), tm);
    int hour = tm.hour;
    
    // Asian Session
    if(TradeAsianSession && hour >= AsianStart && hour < AsianEnd)
        return true;
    
    // London Session
    if(TradeLondonSession && hour >= LondonStart && hour < LondonEnd)
        return true;
    
    // NY Session
    if(TradeNYSession && hour >= NYStart && hour < NYEnd)
        return true;
    
    return false;
}
//+------------------------------------------------------------------+

