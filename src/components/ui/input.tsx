import * as React from 'react';

import { cn } from '@/lib/utils';

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<'input'>>(({ className, type, ...props }, ref) => {
  return (
    <input
      type={type}
      className="flowi-input flowi-input flowi-input flowi-input flowi-input flowi-input flowi-input flowi-input flowi-input flowi-input flowi-input flowi-input flowi-input flowi-input flowi-input flowi-input flowi-input flowi-input flowi-input flowi-input flowi-input flowi-input flowi-input flowi-input flowi-input flowi-input flowi-input flowi-input flowi-input flowi-input flowi-input flowi-input flowi-input flowi-input flowi-input flowi-input flowi-input flowi-input flowi-input flowi-input flowi-input flowi-input flowi-input flowi-input flowi-input flowi-input flowi-input flowi-input flowi-input flowi-input flowi-input flowi-input flowi-input flowi-input flowi-input flowi-input flowi-input flowi-input flowi-input flowi-input flowi-input flowi-input flowi-input flex h-10 w-full border border-input text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm flowi-input mx-[200px] my-[8px] px-[12px] py-[8px] bg-[#00000000] rounded-[6px] mt-[8px] mr-[200px] mb-[0px] ml-[0px] pt-[8px] pr-[0px] pb-[8px] pl-[7px] font-medium opacity-100 text-[#1F2937]"
      ref={ref}
      {...props}
    />
  );
});
Input.displayName = 'Input';

export { Input };
