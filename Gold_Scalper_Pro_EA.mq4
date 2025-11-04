//+------------------------------------------------------------------+
//|                                         Gold_Scalper_Pro_EA.mq4  |
//|                         Fast Gold Day Trading - ICT + Scalping   |
//|                                                                   |
//+------------------------------------------------------------------+
#property copyright "EmaScript Gold Scalper Pro"
#property link      "https://emascript.com"
#property version   "1.00"
#property strict

//--- Input Parameters
input group "=== Risk Management ==="
input double RiskPercent = 1.0;                    // Risk per trade (%)
input double RiskRewardRatio = 2.0;                // Risk:Reward Ratio
input int MaxOpenTrades = 3;                       // Maximum simultaneous trades
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

//--- Global Variables
datetime lastTradeTime = 0;

//+------------------------------------------------------------------+
//| Expert initialization function                                   |
//+------------------------------------------------------------------+
int OnInit()
{
    Print("╔══════════════════════════════════════════════════════════╗");
    Print("║     GOLD SCALPER PRO EA - INITIALIZED SUCCESSFULLY!      ║");
    Print("╚══════════════════════════════════════════════════════════╝");
    Print("Symbol: ", Symbol());
    Print("Timeframe: ", Period());
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
    
    //--- Check if we can trade (max trades)
    if(CountOpenTrades() >= MaxOpenTrades)
        return;
    
    //--- Check minimum bars between trades
    int barsSinceLastTrade = iBarShift(Symbol(), Period(), lastTradeTime);
    if(barsSinceLastTrade < MinBarsBetweenTrades && barsSinceLastTrade != -1)
        return;
    
    //--- Check time filter
    if(!IsInTradingSession())
        return;
    
    //--- Check for trading signals
    int signal = GetTradingSignal();
    
    if(signal == 1) // Buy signal
    {
        OpenBuyTrade();
    }
    else if(signal == -1) // Sell signal
    {
        OpenSellTrade();
    }
}

//+------------------------------------------------------------------+
//| Get trading signal                                               |
//+------------------------------------------------------------------+
int GetTradingSignal()
{
    int buySignals = 0;
    int sellSignals = 0;
    
    double fastMA_0 = iMA(Symbol(), Period(), FastMA, 0, MODE_EMA, PRICE_CLOSE, 0);
    double fastMA_1 = iMA(Symbol(), Period(), FastMA, 0, MODE_EMA, PRICE_CLOSE, 1);
    double slowMA_0 = iMA(Symbol(), Period(), SlowMA, 0, MODE_EMA, PRICE_CLOSE, 0);
    double slowMA_1 = iMA(Symbol(), Period(), SlowMA, 0, MODE_EMA, PRICE_CLOSE, 1);
    double rsi_0 = iRSI(Symbol(), Period(), RSI_Period, PRICE_CLOSE, 0);
    double rsi_1 = iRSI(Symbol(), Period(), RSI_Period, PRICE_CLOSE, 1);
    
    //--- Strategy 1: MA Crossover
    if(UseMAXCross)
    {
        if(fastMA_0 > slowMA_0 && fastMA_1 <= slowMA_1)
        {
            buySignals++;
            Print("📈 BUY Signal: MA Crossover");
        }
        else if(fastMA_0 < slowMA_0 && fastMA_1 >= slowMA_1)
        {
            sellSignals++;
            Print("📉 SELL Signal: MA Crossover");
        }
    }
    
    //--- Strategy 2: Momentum with RSI
    if(UseMomentum)
    {
        bool bullishMomentum = fastMA_0 > slowMA_0 && rsi_0 > 50 && rsi_0 < RSI_Overbought;
        bool bearishMomentum = fastMA_0 < slowMA_0 && rsi_0 < 50 && rsi_0 > RSI_Oversold;
        
        if(bullishMomentum && rsi_1 <= 50)
        {
            buySignals++;
            Print("📈 BUY Signal: Bullish Momentum (RSI: ", DoubleToStr(rsi_0, 1), ")");
        }
        else if(bearishMomentum && rsi_1 >= 50)
        {
            sellSignals++;
            Print("📉 SELL Signal: Bearish Momentum (RSI: ", DoubleToStr(rsi_0, 1), ")");
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
    if(rsi_0 < RSI_Oversold && rsi_1 >= RSI_Oversold)
    {
        buySignals++;
        Print("📈 BUY Signal: RSI Oversold Reversal");
    }
    else if(rsi_0 > RSI_Overbought && rsi_1 <= RSI_Overbought)
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
//| Check Engulfing Pattern                                          |
//+------------------------------------------------------------------+
int CheckEngulfingPattern()
{
    double open1 = iOpen(Symbol(), Period(), 1);
    double close1 = iClose(Symbol(), Period(), 1);
    double open2 = iOpen(Symbol(), Period(), 2);
    double close2 = iClose(Symbol(), Period(), 2);
    
    // Bullish Engulfing
    if(close2 < open2 && close1 > open1 && close1 > open2 && open1 < close2)
        return 1;
    
    // Bearish Engulfing
    if(close2 > open2 && close1 < open1 && close1 < open2 && open1 > close2)
        return -1;
    
    return 0;
}

//+------------------------------------------------------------------+
//| Check Support/Resistance Break                                   |
//+------------------------------------------------------------------+
int CheckSupportResistanceBreak()
{
    int highestBar = iHighest(Symbol(), Period(), MODE_HIGH, LookbackBars, 1);
    int lowestBar = iLowest(Symbol(), Period(), MODE_LOW, LookbackBars, 1);
    
    double resistance = iHigh(Symbol(), Period(), highestBar);
    double support = iLow(Symbol(), Period(), lowestBar);
    
    double currentClose = iClose(Symbol(), Period(), 0);
    double previousClose = iClose(Symbol(), Period(), 1);
    
    double breakoutThreshold = 10 * Point;
    
    // Resistance breakout
    if(currentClose > resistance + breakoutThreshold && previousClose <= resistance)
        return 1;
    
    // Support breakdown
    if(currentClose < support - breakoutThreshold && previousClose >= support)
        return -1;
    
    return 0;
}

//+------------------------------------------------------------------+
//| Open Buy Trade                                                   |
//+------------------------------------------------------------------+
void OpenBuyTrade()
{
    double atr = iATR(Symbol(), Period(), ATR_Period, 0);
    
    //--- Calculate dynamic SL and TP based on ATR
    double slDistance = MathMax(atr * SL_Multiplier, MinSL_Points * Point);
    slDistance = MathMin(slDistance, MaxSL_Points * Point);
    
    double tpDistance = slDistance * RiskRewardRatio;
    
    double sl = NormalizeDouble(Ask - slDistance, Digits);
    double tp = NormalizeDouble(Ask + tpDistance, Digits);
    
    //--- Calculate lot size
    double lotSize = CalculateLotSize(slDistance);
    
    //--- Open trade
    int ticket = OrderSend(Symbol(), OP_BUY, lotSize, Ask, 3, sl, tp, TradeComment, MagicNumber, 0, clrGreen);
    
    if(ticket > 0)
    {
        lastTradeTime = TimeCurrent();
        Print("═══════════════════════════════════════════════════════");
        Print("✅ BUY ORDER OPENED! Ticket: ", ticket);
        Print("Price: ", Ask);
        Print("Lot Size: ", lotSize);
        Print("SL: ", sl, " (", DoubleToStr(slDistance / Point, 0), " points)");
        Print("TP: ", tp, " (", DoubleToStr(tpDistance / Point, 0), " points)");
        Print("ATR: ", DoubleToStr(atr, Digits));
        Print("═══════════════════════════════════════════════════════");
    }
    else
    {
        Print("❌ Error opening BUY: ", GetLastError());
    }
}

//+------------------------------------------------------------------+
//| Open Sell Trade                                                  |
//+------------------------------------------------------------------+
void OpenSellTrade()
{
    double atr = iATR(Symbol(), Period(), ATR_Period, 0);
    
    //--- Calculate dynamic SL and TP based on ATR
    double slDistance = MathMax(atr * SL_Multiplier, MinSL_Points * Point);
    slDistance = MathMin(slDistance, MaxSL_Points * Point);
    
    double tpDistance = slDistance * RiskRewardRatio;
    
    double sl = NormalizeDouble(Bid + slDistance, Digits);
    double tp = NormalizeDouble(Bid - tpDistance, Digits);
    
    //--- Calculate lot size
    double lotSize = CalculateLotSize(slDistance);
    
    //--- Open trade
    int ticket = OrderSend(Symbol(), OP_SELL, lotSize, Bid, 3, sl, tp, TradeComment, MagicNumber, 0, clrRed);
    
    if(ticket > 0)
    {
        lastTradeTime = TimeCurrent();
        Print("═══════════════════════════════════════════════════════");
        Print("✅ SELL ORDER OPENED! Ticket: ", ticket);
        Print("Price: ", Bid);
        Print("Lot Size: ", lotSize);
        Print("SL: ", sl, " (", DoubleToStr(slDistance / Point, 0), " points)");
        Print("TP: ", tp, " (", DoubleToStr(tpDistance / Point, 0), " points)");
        Print("ATR: ", DoubleToStr(atr, Digits));
        Print("═══════════════════════════════════════════════════════");
    }
    else
    {
        Print("❌ Error opening SELL: ", GetLastError());
    }
}

//+------------------------------------------------------------------+
//| Calculate lot size based on risk                                 |
//+------------------------------------------------------------------+
double CalculateLotSize(double slDistance)
{
    double accountBalance = AccountBalance();
    double riskAmount = accountBalance * (RiskPercent / 100.0);
    
    double tickValue = MarketInfo(Symbol(), MODE_TICKVALUE);
    double tickSize = MarketInfo(Symbol(), MODE_TICKSIZE);
    
    double moneyPerPoint = (tickValue / tickSize) * Point;
    double slPoints = slDistance / Point;
    
    double lotSize = riskAmount / (slPoints * moneyPerPoint);
    
    //--- Normalize lot size
    double minLot = MarketInfo(Symbol(), MODE_MINLOT);
    double maxLot = MarketInfo(Symbol(), MODE_MAXLOT);
    double lotStep = MarketInfo(Symbol(), MODE_LOTSTEP);
    
    lotSize = MathFloor(lotSize / lotStep) * lotStep;
    lotSize = MathMax(lotSize, minLot);
    lotSize = MathMin(lotSize, maxLot);
    lotSize = MathMin(lotSize, MaxLotSize);
    
    return NormalizeDouble(lotSize, 2);
}

//+------------------------------------------------------------------+
//| Manage trailing stops                                            |
//+------------------------------------------------------------------+
void ManageTrailingStops()
{
    double atr = iATR(Symbol(), Period(), ATR_Period, 0);
    double trailStart = atr * TrailStart_Multiplier;
    double trailDistance = atr * TrailDistance_Multiplier;
    
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
            double profit = Bid - openPrice;
            
            if(profit >= trailStart)
            {
                double newSL = NormalizeDouble(Bid - trailDistance, Digits);
                
                if(newSL > currentSL)
                {
                    bool modified = OrderModify(OrderTicket(), OrderOpenPrice(), newSL, currentTP, 0, clrBlue);
                    if(modified)
                        Print("🔒 Trailing Stop Updated (BUY): New SL = ", newSL);
                }
            }
        }
        else if(OrderType() == OP_SELL)
        {
            double profit = openPrice - Ask;
            
            if(profit >= trailStart)
            {
                double newSL = NormalizeDouble(Ask + trailDistance, Digits);
                
                if(newSL < currentSL || currentSL == 0)
                {
                    bool modified = OrderModify(OrderTicket(), OrderOpenPrice(), newSL, currentTP, 0, clrBlue);
                    if(modified)
                        Print("🔒 Trailing Stop Updated (SELL): New SL = ", newSL);
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
//| Check if in trading session                                      |
//+------------------------------------------------------------------+
bool IsInTradingSession()
{
    int hour = Hour();
    
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

