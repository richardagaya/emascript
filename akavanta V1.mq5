//+------------------------------------------------------------------+
//|                                                    Akavanta V1   |
//|                                        Advanced Trading System   |
//+------------------------------------------------------------------+
#property copyright "Akavanta V1"
#property link      "Akavanta.com"
#property version   "1.00"

#include <Trade\Trade.mqh>
#include <Trade\PositionInfo.mqh>

input double RiskPercent = 1.0;
input double RiskRewardRatio = 2.0;
input int PositionsPerSignal = 3;
input bool WaitForAllToClose = true;
input double MaxLotSize = 5.0;

input int FastMA = 9;
input int SlowMA = 21;
input int RSI_Period = 14;
input int RSI_Overbought = 70;
input int RSI_Oversold = 30;
input int ATR_Period = 14;

input bool UseMAXCross = true;
input bool UseMomentum = true;
input bool UsePriceAction = true;
input bool UseSupRes = true;
input int MinConfirmations = 1;
input int LookbackBars = 20;

input double SL_Multiplier = 1.5;
input double TP_Multiplier = 3.0;
input int MinSL_Points = 150;
input int MaxSL_Points = 500;
input bool UseTrailingStop = true;
input double TrailStart_Multiplier = 1.5;
input double TrailDistance_Multiplier = 1.0;

input bool TradeAsianSession = false;
input bool TradeLondonSession = true;
input bool TradeNYSession = true;
input int AsianStart = 0;
input int AsianEnd = 8;
input int LondonStart = 8;
input int LondonEnd = 16;
input int NYStart = 13;
input int NYEnd = 22;

input int MagicNumber = 789456;
input string TradeComment = "Akavanta_V1";
input int MinBarsBetweenTrades = 3;

CTrade trade;
CPositionInfo position;

datetime lastTradeTime = 0;
int fastMA_Handle, slowMA_Handle, rsi_Handle, atr_Handle;
double fastMA_Buffer[], slowMA_Buffer[], rsi_Buffer[], atr_Buffer[];

//+------------------------------------------------------------------+
int OnInit()
{
    trade.SetExpertMagicNumber(MagicNumber);
    trade.SetDeviationInPoints(10);
    trade.SetTypeFilling(ORDER_FILLING_FOK);
    trade.SetAsyncMode(false);
    
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
    
    ArraySetAsSeries(fastMA_Buffer, true);
    ArraySetAsSeries(slowMA_Buffer, true);
    ArraySetAsSeries(rsi_Buffer, true);
    ArraySetAsSeries(atr_Buffer, true);
    
    Print("Akavanta V1 initialized | Risk: ", RiskPercent, "% | R:R: ", RiskRewardRatio, ":1");
    
    return(INIT_SUCCEEDED);
}

//+------------------------------------------------------------------+
void OnDeinit(const int reason)
{
    IndicatorRelease(fastMA_Handle);
    IndicatorRelease(slowMA_Handle);
    IndicatorRelease(rsi_Handle);
    IndicatorRelease(atr_Handle);
}

//+------------------------------------------------------------------+
void OnTick()
{
    if(UseTrailingStop)
        ManageTrailingStops();
    
    int openTrades = CountOpenTrades();
    if(WaitForAllToClose && openTrades > 0)
        return;
    
    if(!WaitForAllToClose && openTrades >= PositionsPerSignal)
        return;
    
    int barsSinceLastTrade = iBarShift(_Symbol, _Period, lastTradeTime);
    if(barsSinceLastTrade < MinBarsBetweenTrades && barsSinceLastTrade != -1)
        return;
    
    if(!IsInTradingSession())
        return;
    
    if(!UpdateIndicators())
        return;
    
    int signal = GetTradingSignal();
    
    if(signal == 1)
        OpenMultipleBuyTrades();
    else if(signal == -1)
        OpenMultipleSellTrades();
}

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
int GetTradingSignal()
{
    int buySignals = 0;
    int sellSignals = 0;
    
    if(UseMAXCross && CheckMACross())
    {
        if(fastMA_Buffer[0] > slowMA_Buffer[0] && fastMA_Buffer[1] <= slowMA_Buffer[1])
            buySignals++;
        else if(fastMA_Buffer[0] < slowMA_Buffer[0] && fastMA_Buffer[1] >= slowMA_Buffer[1])
            sellSignals++;
    }
    
    if(UseMomentum)
    {
        bool bullishMomentum = fastMA_Buffer[0] > slowMA_Buffer[0] && 
                               rsi_Buffer[0] > 50 && rsi_Buffer[0] < RSI_Overbought;
        bool bearishMomentum = fastMA_Buffer[0] < slowMA_Buffer[0] && 
                               rsi_Buffer[0] < 50 && rsi_Buffer[0] > RSI_Oversold;
        
        if(bullishMomentum && rsi_Buffer[1] <= 50)
            buySignals++;
        else if(bearishMomentum && rsi_Buffer[1] >= 50)
            sellSignals++;
    }
    
    if(UsePriceAction)
    {
        int engulfing = CheckEngulfingPattern();
        if(engulfing == 1)
            buySignals++;
        else if(engulfing == -1)
            sellSignals++;
    }
    
    if(UseSupRes)
    {
        int breakout = CheckSupportResistanceBreak();
        if(breakout == 1)
            buySignals++;
        else if(breakout == -1)
            sellSignals++;
    }
    
    if(rsi_Buffer[0] < RSI_Oversold && rsi_Buffer[1] >= RSI_Oversold)
        buySignals++;
    else if(rsi_Buffer[0] > RSI_Overbought && rsi_Buffer[1] <= RSI_Overbought)
        sellSignals++;
    
    if(buySignals >= MinConfirmations)
        return 1;
    else if(sellSignals >= MinConfirmations)
        return -1;
    
    return 0;
}

//+------------------------------------------------------------------+
bool CheckMACross()
{
    return true;
}

//+------------------------------------------------------------------+
int CheckEngulfingPattern()
{
    double open1 = iOpen(_Symbol, _Period, 1);
    double close1 = iClose(_Symbol, _Period, 1);
    double open2 = iOpen(_Symbol, _Period, 2);
    double close2 = iClose(_Symbol, _Period, 2);
    
    if(close2 < open2 && close1 > open1 && close1 > open2 && open1 < close2)
        return 1;
    
    if(close2 > open2 && close1 < open1 && close1 < open2 && open1 > close2)
        return -1;
    
    return 0;
}

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
    
    double resistance = high[ArrayMaximum(high, 1, LookbackBars)];
    double support = low[ArrayMinimum(low, 1, LookbackBars)];
    
    double currentClose = iClose(_Symbol, _Period, 0);
    double previousClose = iClose(_Symbol, _Period, 1);
    
    double point = SymbolInfoDouble(_Symbol, SYMBOL_POINT);
    double breakoutThreshold = 10 * point;
    
    if(currentClose > resistance + breakoutThreshold && previousClose <= resistance)
        return 1;
    
    if(currentClose < support - breakoutThreshold && previousClose >= support)
        return -1;
    
    return 0;
}

//+------------------------------------------------------------------+
void OpenMultipleBuyTrades()
{
    if(ArraySize(atr_Buffer) < 1)
        return;
    
    double ask = SymbolInfoDouble(_Symbol, SYMBOL_ASK);
    double atr = atr_Buffer[0];
    double point = SymbolInfoDouble(_Symbol, SYMBOL_POINT);
    int digits = (int)SymbolInfoInteger(_Symbol, SYMBOL_DIGITS);
    
    double slDistance = MathMax(atr * SL_Multiplier, MinSL_Points * point);
    slDistance = MathMin(slDistance, MaxSL_Points * point);
    double tpDistance = slDistance * RiskRewardRatio;
    
    double sl = NormalizeDouble(ask - slDistance, digits);
    double tp = NormalizeDouble(ask + tpDistance, digits);
    
    double riskPerPosition = RiskPercent / PositionsPerSignal;
    double lotSize = CalculateLotSizeWithRisk(slDistance, riskPerPosition);
    
    int successCount = 0;
    
    for(int i = 0; i < PositionsPerSignal; i++)
    {
        string comment = TradeComment + " #" + IntegerToString(i + 1);
        
        if(trade.Buy(lotSize, _Symbol, ask, sl, tp, comment))
            successCount++;
        
        Sleep(100);
    }
    
    if(successCount > 0)
        lastTradeTime = TimeCurrent();
}

//+------------------------------------------------------------------+
void OpenMultipleSellTrades()
{
    if(ArraySize(atr_Buffer) < 1)
        return;
    
    double bid = SymbolInfoDouble(_Symbol, SYMBOL_BID);
    double atr = atr_Buffer[0];
    double point = SymbolInfoDouble(_Symbol, SYMBOL_POINT);
    int digits = (int)SymbolInfoInteger(_Symbol, SYMBOL_DIGITS);
    
    double slDistance = MathMax(atr * SL_Multiplier, MinSL_Points * point);
    slDistance = MathMin(slDistance, MaxSL_Points * point);
    double tpDistance = slDistance * RiskRewardRatio;
    
    double sl = NormalizeDouble(bid + slDistance, digits);
    double tp = NormalizeDouble(bid - tpDistance, digits);
    
    double riskPerPosition = RiskPercent / PositionsPerSignal;
    double lotSize = CalculateLotSizeWithRisk(slDistance, riskPerPosition);
    
    int successCount = 0;
    
    for(int i = 0; i < PositionsPerSignal; i++)
    {
        string comment = TradeComment + " #" + IntegerToString(i + 1);
        
        if(trade.Sell(lotSize, _Symbol, bid, sl, tp, comment))
            successCount++;
        
        Sleep(100);
    }
    
    if(successCount > 0)
        lastTradeTime = TimeCurrent();
}

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
void ManageTrailingStops()
{
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
                        trade.PositionModify(position.Ticket(), newSL, currentTP);
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
                        trade.PositionModify(position.Ticket(), newSL, currentTP);
                }
            }
        }
    }
}

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
bool IsInTradingSession()
{
    MqlDateTime tm;
    TimeToStruct(TimeCurrent(), tm);
    int hour = tm.hour;
    
    if(TradeAsianSession && hour >= AsianStart && hour < AsianEnd)
        return true;
    
    if(TradeLondonSession && hour >= LondonStart && hour < LondonEnd)
        return true;
    
    if(TradeNYSession && hour >= NYStart && hour < NYEnd)
        return true;
    
    return false;
}
//+------------------------------------------------------------------+