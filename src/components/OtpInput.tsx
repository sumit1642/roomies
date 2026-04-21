import { useRef, useState, type KeyboardEvent, type ClipboardEvent } from "react";
import { cn } from "#/lib/utils";

interface OtpInputProps {
	length?: number;
	value: string;
	onChange: (value: string) => void;
	disabled?: boolean;
}

export function OtpInput({ length = 6, value, onChange, disabled }: OtpInputProps) {
	const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
	const [focusedIndex, setFocusedIndex] = useState(-1);

	const digits = value.split("").concat(Array(length - value.length).fill(""));

	const handleChange = (index: number, digit: string) => {
		if (!/^\d*$/.test(digit)) return;

		const newDigits = [...digits];
		newDigits[index] = digit.slice(-1);
		const newValue = newDigits.join("").slice(0, length);
		onChange(newValue);

		// Auto-advance to next input
		if (digit && index < length - 1) {
			inputRefs.current[index + 1]?.focus();
		}
	};

	const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
		if (e.key === "Backspace" && !digits[index] && index > 0) {
			inputRefs.current[index - 1]?.focus();
		}
		if (e.key === "ArrowLeft" && index > 0) {
			inputRefs.current[index - 1]?.focus();
		}
		if (e.key === "ArrowRight" && index < length - 1) {
			inputRefs.current[index + 1]?.focus();
		}
	};

	const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
		e.preventDefault();
		const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
		onChange(pastedData);
		const nextIndex = Math.min(pastedData.length, length - 1);
		inputRefs.current[nextIndex]?.focus();
	};

	return (
		<div className="flex gap-2 justify-center">
			{digits.slice(0, length).map((digit, index) => (
				<input
					key={index}
					ref={(el) => {
						inputRefs.current[index] = el;
					}}
					type="text"
					inputMode="numeric"
					maxLength={1}
					value={digit}
					disabled={disabled}
					onChange={(e) => handleChange(index, e.target.value)}
					onKeyDown={(e) => handleKeyDown(index, e)}
					onPaste={handlePaste}
					onFocus={() => setFocusedIndex(index)}
					onBlur={() => setFocusedIndex(-1)}
					className={cn(
						"size-12 text-center text-lg font-semibold rounded-lg border border-input bg-background transition-all",
						"focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
						"disabled:cursor-not-allowed disabled:opacity-50",
						focusedIndex === index && "ring-2 ring-ring ring-offset-2",
					)}
				/>
			))}
		</div>
	);
}
