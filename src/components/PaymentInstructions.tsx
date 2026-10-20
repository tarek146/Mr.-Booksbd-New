import React, { useState } from 'react';
import { PaymentMethodConfig } from '../types';
import { Copy, Check, Smartphone, ArrowRight, Info, ShieldCheck, CheckCircle2 } from 'lucide-react';

interface PaymentInstructionsProps {
  selectedMethod: PaymentMethodConfig;
  totalAmount: number;
  transactionId: string;
  setTransactionId: (val: string) => void;
  senderNumber: string;
  setSenderNumber: (val: string) => void;
}

export function PaymentInstructions({
  selectedMethod,
  totalAmount,
  transactionId,
  setTransactionId,
  senderNumber,
  setSenderNumber
}: PaymentInstructionsProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = (text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Helper method styling & branding badge
  const getBrandBadge = () => {
    if (selectedMethod.logoUrl) {
      return (
        <img 
          src={selectedMethod.logoUrl} 
          alt={selectedMethod.name} 
          className="w-10 h-10 object-contain rounded-xl border border-[#E5E5E5] p-1 bg-white shrink-0 shadow-2xs" 
        />
      );
    }

    switch (selectedMethod.type) {
      case 'bkash':
        return (
          <div className="w-10 h-10 rounded-xl bg-[#E2136E] text-white font-black text-sm flex items-center justify-center shrink-0 shadow-md tracking-tighter">
            bKash
          </div>
        );
      case 'nagad':
        return (
          <div className="w-10 h-10 rounded-xl bg-[#F15A24] text-white font-black text-xs flex items-center justify-center shrink-0 shadow-md">
            নগদ
          </div>
        );
      case 'rocket':
        return (
          <div className="w-10 h-10 rounded-xl bg-[#8C3494] text-white font-black text-xs flex items-center justify-center shrink-0 shadow-md">
            Rocket
          </div>
        );
      case 'upay':
        return (
          <div className="w-10 h-10 rounded-xl bg-[#00A859] text-white font-black text-xs flex items-center justify-center shrink-0 shadow-md">
            Upay
          </div>
        );
      case 'bank':
        return (
          <div className="w-10 h-10 rounded-xl bg-[#1E3A8A] text-white font-black text-xs flex items-center justify-center shrink-0 shadow-md">
            Bank
          </div>
        );
      default:
        return (
          <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-md">
            COD
          </div>
        );
    }
  };

  // Generate step-by-step instructions based on payment method type
  const getStepList = () => {
    const accType = selectedMethod.accountType || (selectedMethod.type === 'bkash' ? 'Personal' : 'Merchant');

    if (selectedMethod.type === 'bkash') {
      return [
        {
          step: 1,
          title: 'Open bKash App or Dial *247#',
          description: `Open your bKash app or dial *247# from your mobile phone.`
        },
        {
          step: 2,
          title: `Select "${accType === 'Merchant' ? 'Make Payment' : 'Send Money'}"`,
          description: `Choose ${accType === 'Merchant' ? 'Make Payment' : 'Send Money'} from the menu.`
        },
        {
          step: 3,
          title: 'Enter Receiver Account Number',
          description: `Enter receiver number: ${selectedMethod.accountNumber} (${selectedMethod.accountName}).`
        },
        {
          step: 4,
          title: 'Enter Exact Amount',
          description: `Enter exact total order amount: ৳${totalAmount}`
        },
        {
          step: 5,
          title: 'Enter Reference & Confirm PIN',
          description: `Enter reference "MRBOOKS" and input your bKash PIN to confirm transaction.`
        },
        {
          step: 6,
          title: 'Copy & Enter TrxID Below',
          description: `Copy the Transaction ID (TrxID) received via SMS and enter it in the form below.`
        }
      ];
    }

    if (selectedMethod.type === 'nagad') {
      return [
        {
          step: 1,
          title: 'Open Nagad App or Dial *167#',
          description: `Open your Nagad app or dial *167# from your mobile phone.`
        },
        {
          step: 2,
          title: `Choose "${accType === 'Merchant' ? 'Merchant Pay' : 'Send Money'}"`,
          description: `Select ${accType === 'Merchant' ? 'Merchant Pay' : 'Send Money'} from options.`
        },
        {
          step: 3,
          title: 'Enter Receiver Number',
          description: `Target number: ${selectedMethod.accountNumber} (${selectedMethod.accountName}).`
        },
        {
          step: 4,
          title: 'Enter Amount',
          description: `Amount to send: ৳${totalAmount}`
        },
        {
          step: 5,
          title: 'Enter PIN & Tap to Pay',
          description: `Enter your Nagad secret PIN and hold to confirm transfer.`
        },
        {
          step: 6,
          title: 'Submit Transaction ID (TrxID)',
          description: `Enter the Nagad Transaction ID (TrxID) in the field below.`
        }
      ];
    }

    if (selectedMethod.type === 'rocket') {
      return [
        {
          step: 1,
          title: 'Open Rocket App or Dial *322#',
          description: `Access your DBBL Rocket account via App or USSD *322#.`
        },
        {
          step: 2,
          title: 'Select "Send Money" or "Merchant Pay"',
          description: `Choose Send Money option.`
        },
        {
          step: 3,
          title: 'Enter Rocket Mobile Account Number',
          description: `Account number: ${selectedMethod.accountNumber}.`
        },
        {
          step: 4,
          title: 'Enter Total Amount & PIN',
          description: `Enter ৳${totalAmount} and enter your PIN to execute transfer.`
        },
        {
          step: 5,
          title: 'Submit Rocket TxnID Below',
          description: `Provide your Rocket TxnID and mobile number below for instant verification.`
        }
      ];
    }

    if (selectedMethod.type === 'upay') {
      return [
        {
          step: 1,
          title: 'Open Upay App or Dial *268#',
          description: `Launch Upay application on your mobile device.`
        },
        {
          step: 2,
          title: 'Select "Send Money"',
          description: `Choose Send Money option.`
        },
        {
          step: 3,
          title: 'Enter Upay Account Number',
          description: `Receiver: ${selectedMethod.accountNumber}.`
        },
        {
          step: 4,
          title: 'Enter Amount ৳' + totalAmount + ' & PIN',
          description: `Confirm transaction with your Upay PIN.`
        },
        {
          step: 5,
          title: 'Submit Upay TrxID Below',
          description: `Copy your Upay TrxID and paste it in the field below.`
        }
      ];
    }

    if (selectedMethod.type === 'bank') {
      return [
        {
          step: 1,
          title: 'Initiate Bank Transfer (NPSB / BEFTN / App / Internet Banking)',
          description: `Use your bank mobile app, internet banking or counter deposit.`
        },
        {
          step: 2,
          title: 'Enter Bank Account Details',
          description: `Account Name: ${selectedMethod.accountName} | Account No: ${selectedMethod.accountNumber}${selectedMethod.bankName ? ` | Bank: ${selectedMethod.bankName}` : ''}`
        },
        {
          step: 3,
          title: 'Transfer ৳' + totalAmount + ' Payable Amount',
          description: `Transfer exact total amount ৳${totalAmount}.`
        },
        {
          step: 4,
          title: 'Enter Reference or Receipt ID Below',
          description: `Provide bank transaction reference/deposit slip number below.`
        }
      ];
    }

    // COD Fallback
    return [
      {
        step: 1,
        title: 'Pay Upon Delivery',
        description: `Hand over cash ৳${totalAmount} directly to the delivery hero when receiving your book package.`
      }
    ];
  };

  const steps = getStepList();

  if (selectedMethod.type === 'cod') {
    return (
      <div className="bg-emerald-50 rounded-2xl p-5 border border-emerald-200 text-xs text-emerald-900 leading-relaxed space-y-2">
        <div className="flex items-center gap-2 font-bold text-emerald-800 text-sm">
          <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
          <span>Cash on Delivery Selected</span>
        </div>
        <p className="text-emerald-800">
          No advance online payment required! Simply pay <strong className="text-emerald-950">৳{totalAmount}</strong> in cash to the courier representative when your books arrive at your doorstep.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl border border-[#E5E5E5] p-5 sm:p-7 shadow-xs space-y-6 transition-all">
      {/* Header with Provider Branding */}
      <div className="flex items-center justify-between pb-4 border-b border-[#EEEEEE] gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          {getBrandBadge()}
          <div>
            <h3 className="text-base sm:text-lg font-black text-[#171717] tracking-tight">
              {selectedMethod.name} Payment Instructions
            </h3>
            <p className="text-xs text-[#5F6368] flex items-center gap-1.5 mt-0.5">
              <span>Account Type:</span>
              <span className="font-bold text-[#D71920] uppercase tracking-wide bg-[#FFF1F2] px-2 py-0.5 rounded-full text-[10px] border border-[#D71920]/20">
                {selectedMethod.accountType || selectedMethod.type}
              </span>
            </p>
          </div>
        </div>

        <div className="text-right">
          <span className="text-[10px] font-bold text-[#5F6368] uppercase tracking-wider block">Total Payable</span>
          <span className="text-lg font-black text-[#D71920]">৳{totalAmount}</span>
        </div>
      </div>

      {/* Prominent Copyable Receiver Number Box */}
      <div className="bg-[#F7F7F8] rounded-2xl p-4 sm:p-5 border border-[#E5E5E5] space-y-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="space-y-0.5">
            <span className="text-[10px] font-black uppercase text-[#D71920] tracking-wider block">
              Receiver Mobile / Account Number
            </span>
            <div className="text-xl sm:text-2xl font-black text-[#171717] font-mono tracking-wider select-all">
              {selectedMethod.accountNumber}
            </div>
            <p className="text-xs text-[#5F6368]">
              Account Name: <strong className="text-[#171717]">{selectedMethod.accountName}</strong>
            </p>
          </div>

          <button 
            type="button"
            onClick={() => handleCopy(selectedMethod.accountNumber)}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-xs ${
              copied 
                ? 'bg-emerald-600 text-white border border-emerald-600' 
                : 'bg-[#FFF1F2] text-[#D71920] border border-[#D71920]/30 hover:bg-[#D71920] hover:text-white'
            }`}
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
            <span>{copied ? 'Number Copied!' : 'Copy Number'}</span>
          </button>
        </div>

        {selectedMethod.instructions && (
          <div className="pt-2.5 border-t border-[#E5E5E5] text-xs text-[#5F6368] leading-relaxed">
            <span className="font-bold text-[#171717]">Merchant Note: </span>
            {selectedMethod.instructions}
          </div>
        )}
      </div>

      {/* Dynamic Step-by-Step Guidance */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-[#171717] flex items-center gap-1.5">
          <Smartphone size={15} className="text-[#D71920]" />
          <span>Step-by-Step Transfer Steps</span>
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {steps.map((item) => (
            <div 
              key={item.step} 
              className="p-3.5 rounded-2xl bg-neutral-50 border border-neutral-200/80 flex items-start gap-3 hover:border-neutral-300 transition-colors"
            >
              <div className="w-6 h-6 rounded-full bg-[#D71920] text-white font-black text-xs flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                {item.step}
              </div>
              <div className="space-y-0.5 min-w-0">
                <h5 className="font-bold text-xs text-[#171717] leading-tight truncate">
                  {item.title}
                </h5>
                <p className="text-[11px] text-[#5F6368] leading-relaxed">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Transaction Input Fields */}
      <div className="pt-4 border-t border-[#EEEEEE] space-y-4">
        <div className="flex items-center gap-2">
          <ShieldCheck size={18} className="text-[#D71920]" />
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#171717]">
            Payment Verification Details
          </h4>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Sender Mobile / Account Number Input */}
          <div>
            <label className="block text-xs font-bold text-[#5F6368] uppercase tracking-wider mb-1.5">
              Sender Mobile / Account Number <span className="text-[#D71920]">*</span>
            </label>
            <input 
              type="tel" 
              required
              value={senderNumber}
              onChange={e => setSenderNumber(e.target.value)}
              placeholder="e.g. 01712345678"
              className="w-full px-4 py-2.5 rounded-xl border border-[#E5E5E5] bg-white text-sm font-mono text-[#171717] focus:outline-none focus:border-[#D71920] focus:ring-1 focus:ring-[#D71920] transition-colors"
            />
            <p className="text-[10px] text-[#777777] mt-1">
              The mobile number you used to send money.
            </p>
          </div>

          {/* Transaction ID (TrxID) Input */}
          <div>
            <label className="block text-xs font-bold text-[#5F6368] uppercase tracking-wider mb-1.5">
              Transaction ID (TrxID) / Reference <span className="text-[#D71920]">*</span>
            </label>
            <input 
              type="text" 
              required
              value={transactionId}
              onChange={e => setTransactionId(e.target.value.toUpperCase())}
              placeholder="e.g. 9J87K65432"
              className="w-full px-4 py-2.5 rounded-xl border border-[#E5E5E5] bg-white text-sm font-mono uppercase text-[#171717] focus:outline-none focus:border-[#D71920] focus:ring-1 focus:ring-[#D71920] transition-colors"
            />
            <p className="text-[10px] text-[#777777] mt-1">
              Enter the 8-12 character TrxID from SMS confirmation.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
