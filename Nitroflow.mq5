#property copyright "akavanta.com"
#property link      "https://akavanta.com"
#property version   "1.00"

#include <Trade\Trade.mqh>
#include <Trade\PositionInfo.mqh>

// Inputs
input group "Risk Management";
input double RiskPercent = 1.0;
input double RiskRewardRatio = 2.0;
input int MaxOpenTrades = 3;

input group "Strategy Settings";
input bool TradeOrderBlocks = true;
input bool TradeFairValueGaps = true;
input int FVG_MinPoints = 20;

input group "Stop Loss & Take Profit";
input int StopLossPoints = 300;
input int TakeProfitPoints = 600;

input group "General";
input int MagicNumber = 123456;

CTrade trade;
CPositionInfo positionInfo;
datetime lastBarTime = 0;

struct OrderBlock { double high; double low; datetime time; bool isBullish; };
struct FairValueGap { double top; double bottom; datetime time; bool isBullish; };

OrderBlock orderBlocks[];
FairValueGap fvgArray[];

int OnInit()
{
    trade.SetExpertMagicNumber(MagicNumber);
    trade.SetDeviationInPoints(10);
    trade.SetTypeFilling(ORDER_FILLING_FOK);

    ArrayResize(orderBlocks, 0);
    ArrayResize(fvgArray, 0);

    Print("Nitro Flow (akavanta.com) v1.00 initialized. Support: support@akavanta.com");
    return(INIT_SUCCEEDED);
}

void OnDeinit(const int reason)
{
    Print("Nitro Flow stopped.");
}

void OnTick()
{
    datetime currentBarTime = iTime(_Symbol, _Period, 0);
    if(currentBarTime == lastBarTime) return;
    lastBarTime = currentBarTime;

    if(CountOpenTrades() >= MaxOpenTrades) return;

    if(TradeOrderBlocks) UpdateOrderBlocks();
    if(TradeFairValueGaps) UpdateFairValueGaps();

    CheckForTradeSetup();
}

void CheckForTradeSetup()
{
    if(TradeOrderBlocks && CheckBullishOrderBlock()) { OpenBuyTrade("Bullish OB"); return; }
    if(TradeFairValueGaps && CheckBullishFVG())   { OpenBuyTrade("Bullish FVG"); return; }
    if(TradeOrderBlocks && CheckBearishOrderBlock()) { OpenSellTrade("Bearish OB"); return; }
    if(TradeFairValueGaps && CheckBearishFVG())   { OpenSellTrade("Bearish FVG"); return; }
}

void UpdateOrderBlocks()
{
    double high[], low[], close[], open[];
    ArraySetAsSeries(high, true); ArraySetAsSeries(low, true);
    ArraySetAsSeries(close, true); ArraySetAsSeries(open, true);

    int bars = 50;
    CopyHigh(_Symbol, _Period, 0, bars, high);
    CopyLow(_Symbol, _Period, 0, bars, low);
    CopyClose(_Symbol, _Period, 0, bars, close);
    CopyOpen(_Symbol, _Period, 0, bars, open);

    for(int i = 3; i < bars - 3; i++)
    {
        if(close[i] < open[i] && close[i-1] > high[i]) AddOrderBlock(high[i], low[i], iTime(_Symbol, _Period, i), true);
        if(close[i] > open[i] && close[i-1] < low[i])  AddOrderBlock(high[i], low[i], iTime(_Symbol, _Period, i), false);
    }

    CleanOldOrderBlocks();
}

void AddOrderBlock(double h, double l, datetime t, bool bullish)
{
    int size = ArraySize(orderBlocks);
    for(int i = 0; i < size; i++) if(orderBlocks[i].time == t) return;
    ArrayResize(orderBlocks, size + 1);
    orderBlocks[size].high = h; orderBlocks[size].low = l; orderBlocks[size].time = t; orderBlocks[size].isBullish = bullish;
}

void UpdateFairValueGaps()
{
    double high[], low[];
    ArraySetAsSeries(high, true); ArraySetAsSeries(low, true);

    int bars = 50;
    CopyHigh(_Symbol, _Period, 0, bars, high);
    CopyLow(_Symbol, _Period, 0, bars, low);

    double point = SymbolInfoDouble(_Symbol, SYMBOL_POINT);

    for(int i = 2; i < bars - 1; i++)
    {
        if(low[i-2] > high[i])
        {
            double gapSize = (low[i-2] - high[i]) / point;
            if(gapSize >= FVG_MinPoints) AddFVG(low[i-2], high[i], iTime(_Symbol, _Period, i), true);
        }
        if(high[i-2] < low[i])
        {
            double gapSize = (low[i] - high[i-2]) / point;
            if(gapSize >= FVG_MinPoints) AddFVG(low[i], high[i-2], iTime(_Symbol, _Period, i), false);
        }
    }

    CleanOldFVGs();
}

void AddFVG(double top, double bottom, datetime t, bool bullish)
{
    int size = ArraySize(fvgArray);
    for(int i = 0; i < size; i++) if(fvgArray[i].time == t) return;
    ArrayResize(fvgArray, size + 1);
    fvgArray[size].top = top; fvgArray[size].bottom = bottom; fvgArray[size].time = t; fvgArray[size].isBullish = bullish;
}

bool CheckBullishOrderBlock()
{
    double bid = SymbolInfoDouble(_Symbol, SYMBOL_BID);
    for(int i = 0; i < ArraySize(orderBlocks); i++) if(orderBlocks[i].isBullish && bid >= orderBlocks[i].low && bid <= orderBlocks[i].high) return true;
    return false;
}

bool CheckBearishOrderBlock()
{
    double bid = SymbolInfoDouble(_Symbol, SYMBOL_BID);
    for(int i = 0; i < ArraySize(orderBlocks); i++) if(!orderBlocks[i].isBullish && bid >= orderBlocks[i].low && bid <= orderBlocks[i].high) return true;
    return false;
}

bool CheckBullishFVG()
{
    double bid = SymbolInfoDouble(_Symbol, SYMBOL_BID);
    for(int i = 0; i < ArraySize(fvgArray); i++) if(fvgArray[i].isBullish && bid >= fvgArray[i].bottom && bid <= fvgArray[i].top) return true;
    return false;
}

bool CheckBearishFVG()
{
    double bid = SymbolInfoDouble(_Symbol, SYMBOL_BID);
    for(int i = 0; i < ArraySize(fvgArray); i++) if(!fvgArray[i].isBullish && bid >= fvgArray[i].bottom && bid <= fvgArray[i].top) return true;
    return false;
}

void OpenBuyTrade(string signal)
{
    double ask = SymbolInfoDouble(_Symbol, SYMBOL_ASK);
    double point = SymbolInfoDouble(_Symbol, SYMBOL_POINT);
    int digits = (int)SymbolInfoInteger(_Symbol, SYMBOL_DIGITS);

    double lotSize = CalculateLotSize(StopLossPoints);
    double sl = NormalizeDouble(ask - StopLossPoints * point, digits);
    double tp = NormalizeDouble(ask + TakeProfitPoints * point, digits);

    if(trade.Buy(lotSize, _Symbol, ask, sl, tp, signal))
        Print("BUY: ", signal, " | Lot: ", lotSize, " | SL: ", sl, " | TP: ", tp);
    else
        Print("BUY Error: ", trade.ResultRetcodeDescription());
}

void OpenSellTrade(string signal)
{
    double bid = SymbolInfoDouble(_Symbol, SYMBOL_BID);
    double point = SymbolInfoDouble(_Symbol, SYMBOL_POINT);
    int digits = (int)SymbolInfoInteger(_Symbol, SYMBOL_DIGITS);

    double lotSize = CalculateLotSize(StopLossPoints);
    double sl = NormalizeDouble(bid + StopLossPoints * point, digits);
    double tp = NormalizeDouble(bid - TakeProfitPoints * point, digits);

    if(trade.Sell(lotSize, _Symbol, bid, sl, tp, signal))
        Print("SELL: ", signal, " | Lot: ", lotSize, " | SL: ", sl, " | TP: ", tp);
    else
        Print("SELL Error: ", trade.ResultRetcodeDescription());
}

double CalculateLotSize(int stopLossPoints)
{
    double accountBalance = AccountInfoDouble(ACCOUNT_BALANCE);
    double riskAmount = accountBalance * (RiskPercent / 100.0);

    double tickSize = SymbolInfoDouble(_Symbol, SYMBOL_TRADE_TICK_SIZE);
    double tickValue = SymbolInfoDouble(_Symbol, SYMBOL_TRADE_TICK_VALUE);
    double point = SymbolInfoDouble(_Symbol, SYMBOL_POINT);

    double moneyPerPoint = tickValue / tickSize * point;
    double lotSize = riskAmount / (stopLossPoints * moneyPerPoint);

    double minLot = SymbolInfoDouble(_Symbol, SYMBOL_VOLUME_MIN);
    double maxLot = SymbolInfoDouble(_Symbol, SYMBOL_VOLUME_MAX);
    double lotStep = SymbolInfoDouble(_Symbol, SYMBOL_VOLUME_STEP);

    lotSize = MathFloor(lotSize / lotStep) * lotStep;
    lotSize = MathMax(lotSize, minLot);
    lotSize = MathMin(lotSize, maxLot);

    return lotSize;
}

int CountOpenTrades()
{
    int count = 0;
    for(int i = 0; i < PositionsTotal(); i++)
    {
        if(positionInfo.SelectByIndex(i))
        {
            if(positionInfo.Symbol() == _Symbol && positionInfo.Magic() == MagicNumber) count++;
        }
    }
    return count;
}

void CleanOldOrderBlocks()
{
    datetime currentTime = TimeCurrent();
    int newSize = 0;
    for(int i = 0; i < ArraySize(orderBlocks); i++)
    {
        if(currentTime - orderBlocks[i].time < PeriodSeconds(_Period) * 100)
        {
            if(newSize != i) orderBlocks[newSize] = orderBlocks[i];
            newSize++;
        }
    }
    ArrayResize(orderBlocks, newSize);
}

void CleanOldFVGs()
{
    datetime currentTime = TimeCurrent();
    int newSize = 0;
    for(int i = 0; i < ArraySize(fvgArray); i++)
    {
        if(currentTime - fvgArray[i].time < PeriodSeconds(_Period) * 100)
        {
            if(newSize != i) fvgArray[newSize] = fvgArray[i];
            newSize++;
        }
    }
    ArrayResize(fvgArray, newSize);
}
