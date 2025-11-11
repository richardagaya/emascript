//+------------------------------------------------------------------+
//|                 Martingale Example EA (MQL5)                     |
//|                 With EMA filter for entry                        |
//+------------------------------------------------------------------+
#property strict
#include <Trade/Trade.mqh>

CTrade trade;

// --- Inputs
input int    EMA_Period     = 50;       // EMA period
input double StartLot       = 0.10;     // First trade lot size
input double Multiplier     = 2.0;      // Martingale multiplier
input int    StopLossPips   = 200;      // Stop loss in points (20 pips = 200 points)
input int    TakeProfitPips = 400;      // Take profit in points
input ENUM_TIMEFRAMES TimeFrame = PERIOD_M15;

// --- Globals
int    emaHandle;      // Handle for EMA
double lastEMA;        // Latest EMA value
int    lossCount = 0;  // How many losses in a row

//+------------------------------------------------------------------+
//| Expert initialization                                            |
//+------------------------------------------------------------------+
int OnInit()
{
   emaHandle = iMA(_Symbol, TimeFrame, EMA_Period, 0, MODE_EMA, PRICE_CLOSE);
   if (emaHandle == INVALID_HANDLE)
   {
      Print("Failed to create EMA handle!");
      return INIT_FAILED;
   }
   Print("EA initialized successfully.");
   return INIT_SUCCEEDED;
}

//+------------------------------------------------------------------+
//| Expert tick                                                      |
//+------------------------------------------------------------------+
void OnTick()
{
   static datetime lastCandleTime = 0;

   // Only act on new candle
   datetime currentCandle = iTime(_Symbol, TimeFrame, 0);
   if (currentCandle == lastCandleTime) return;
   lastCandleTime = currentCandle;

   // Get EMA value
   double emaBuffer[];
   ArraySetAsSeries(emaBuffer, true);
   if (CopyBuffer(emaHandle, 0, 0, 1, emaBuffer) <= 0) return;
   lastEMA = emaBuffer[0];

   double closePrice = iClose(_Symbol, TimeFrame, 1);

   // Check if we already have trades
   if (PositionsTotal() > 0) return;

   // Calculate lot size (martingale logic)
   double lotSize = StartLot * MathPow(Multiplier, lossCount);

   double ask = NormalizeDouble(SymbolInfoDouble(_Symbol, SYMBOL_ASK), _Digits);
   double bid = NormalizeDouble(SymbolInfoDouble(_Symbol, SYMBOL_BID), _Digits);

   // Entry conditions (simple EMA filter)
   if (closePrice > lastEMA)   // Uptrend → Buy
   {
      double sl = ask - StopLossPips * _Point;
      double tp = ask + TakeProfitPips * _Point;
      if (trade.Buy(lotSize, _Symbol, ask, sl, tp, "Martingale BUY"))
         Print("BUY opened at ", ask, " SL: ", sl, " TP: ", tp);
   }
   else if (closePrice < lastEMA)  // Downtrend → Sell
   {
      double sl = bid + StopLossPips * _Point;
      double tp = bid - TakeProfitPips * _Point;
      if (trade.Sell(lotSize, _Symbol, bid, sl, tp, "Martingale SELL"))
         Print("SELL opened at ", bid, " SL: ", sl, " TP: ", tp);
   }
}

//+------------------------------------------------------------------+
//| Expert deinit                                                    |
//+------------------------------------------------------------------+
void OnDeinit(const int reason)
{
   if (emaHandle != INVALID_HANDLE) IndicatorRelease(emaHandle);
}
