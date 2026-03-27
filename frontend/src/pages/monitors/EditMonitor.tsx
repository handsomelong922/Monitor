import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Box,
  Flex,
  Heading,
  Text,
  TextField,
  IconButton,
  Container,
  Checkbox,
} from "@radix-ui/themes";

import {
  Button,
  Card,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
  Textarea,
} from "@/components/ui";
import {
  ArrowLeftIcon,
  UpdateIcon,
  PlusIcon,
  TrashIcon,
} from "@radix-ui/react-icons";
import { getMonitor, updateMonitor } from "../../api/monitors";
import StatusCodeSelect from "../../components/StatusCodeSelect";
import { useTranslation } from "react-i18next";
import { TimeWindow } from "../../types/monitors";

const EditMonitor = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: "",
    url: "",
    method: "GET",
    interval: 60,
    timeout: 30,
    expectedStatus: 200,
    body: "",
  });

  // 请求头部分使用键值对数组
  const [headers, setHeaders] = useState<{ key: string; value: string }[]>([
    { key: "", value: "" },
  ]);
  
  // 时区配置
  const [timezone, setTimezone] = useState("Asia/Shanghai");
  
  // 时间窗口配置
  const [timeWindows, setTimeWindows] = useState<TimeWindow[]>([]);
  
  // 活跃天数配置
  const [dayPreset, setDayPreset] = useState<"everyday" | "workdays" | "weekends" | "custom">("everyday");
  const [customDays, setCustomDays] = useState<number[]>([]);

  useEffect(() => {
    // 获取监控数据
    const fetchMonitor = async () => {
      if (!id) return;

      try {
        setLoadingData(true);
        const response = await getMonitor(parseInt(id));

        if (response.success && response.monitor) {
          const monitor = response.monitor;
          setFormData({
            name: monitor.name,
            url: monitor.url,
            method: monitor.method,
            interval: Math.floor(monitor.interval / 60), // 从秒转换为分钟
            timeout: monitor.timeout,
            expectedStatus: monitor.expected_status || 200,
            body: monitor.body || "",
          });

          // 处理请求头
          if (monitor.headers) {
            try {
              // 确保 headers 是对象
              const headersObj =
                typeof monitor.headers === "string"
                  ? JSON.parse(monitor.headers)
                  : monitor.headers;

              const headerPairs = Object.entries(headersObj).map(
                ([key, value]) => ({
                  key,
                  value: value as string,
                })
              );

              // 如果没有请求头，添加一个空行，否则添加一个空行用于新增
              if (headerPairs.length === 0) {
                headerPairs.push({ key: "", value: "" });
              } else {
                headerPairs.push({ key: "", value: "" });
              }

              setHeaders(headerPairs);
            } catch (error) {
              console.error(t("common.error.fetch"), error);
              setHeaders([{ key: "", value: "" }]);
            }
          }
          
          // 处理时区
          if (monitor.active_timezone) {
            setTimezone(monitor.active_timezone);
          }
          
          // 处理时间窗口
          if (monitor.active_windows && monitor.active_windows.length > 0) {
            setTimeWindows(monitor.active_windows);
          }
          
          // 处理活跃天数
          if (monitor.active_days && monitor.active_days.length > 0) {
            setCustomDays(monitor.active_days);
            // 判断预设
            const sortedDays = [...monitor.active_days].sort();
            const daysStr = JSON.stringify(sortedDays);
            if (daysStr === JSON.stringify([1, 2, 3, 4, 5])) {
              setDayPreset("workdays");
            } else if (daysStr === JSON.stringify([0, 6])) {
              setDayPreset("weekends");
            } else {
              setDayPreset("custom");
            }
          } else {
            setDayPreset("everyday");
          }
        } else {
          setError(response.message || t("common.error.fetch"));
        }
      } catch (err) {
        console.error(t("common.error.fetch"), err);
        setError(t("common.error.fetch"));
      } finally {
        setLoadingData(false);
      }
    };

    fetchMonitor();
  }, [id, t]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === "interval" || name === "timeout" || name === "expectedStatus"
          ? parseInt(value) || 0
          : value,
    }));
  };

  // 处理状态码变更
  const handleStatusCodeChange = (value: number) => {
    setFormData((prev) => ({ ...prev, expectedStatus: value }));
  };

  // 处理请求头键值对更改
  const handleHeaderChange = (
    index: number,
    field: "key" | "value",
    value: string
  ) => {
    const newHeaders = [...headers];
    newHeaders[index][field] = value;
    setHeaders(newHeaders);
  };

  // 删除请求头行
  const removeHeader = (index: number) => {
    if (headers.length > 1) {
      const newHeaders = [...headers];
      newHeaders.splice(index, 1);
      setHeaders(newHeaders);
    }
  };

  // 将键值对转换为对象
  const headersToObject = () => {
    const result: Record<string, string> = {};

    headers.forEach(({ key, value }) => {
      // 只处理有效的键值对
      if (key.trim()) {
        result[key.trim()] = value;
      }
    });

    return result;
  };
  
  // 添加时间窗口
  const addTimeWindow = () => {
    setTimeWindows([...timeWindows, { start: "09:00", end: "18:00" }]);
  };
  
  // 删除时间窗口
  const removeTimeWindow = (index: number) => {
    const newWindows = [...timeWindows];
    newWindows.splice(index, 1);
    setTimeWindows(newWindows);
  };
  
  // 更新时间窗口
  const updateTimeWindow = (index: number, field: "start" | "end", value: string) => {
    const newWindows = [...timeWindows];
    newWindows[index][field] = value;
    setTimeWindows(newWindows);
  };
  
  // 处理日期预设变更
  const handleDayPresetChange = (preset: "everyday" | "workdays" | "weekends" | "custom") => {
    setDayPreset(preset);
    if (preset === "everyday") {
      setCustomDays([]);
    } else if (preset === "workdays") {
      setCustomDays([1, 2, 3, 4, 5]); // Monday to Friday
    } else if (preset === "weekends") {
      setCustomDays([0, 6]); // Sunday and Saturday
    }
  };
  
  // 切换自定义天数
  const toggleCustomDay = (day: number) => {
    if (customDays.includes(day)) {
      setCustomDays(customDays.filter(d => d !== day));
    } else {
      setCustomDays([...customDays, day].sort());
    }
  };
  
  // 获取活跃天数数组（用于提交）
  const getActiveDays = (): number[] | undefined => {
    if (dayPreset === "everyday") {
      return undefined; // 全天，不传值
    }
    return customDays.length > 0 ? customDays : undefined;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    setLoading(true);

    try {
      // 获取处理后的请求头数据
      const headersData = headersToObject();
      
      // 准备活跃天数
      const activeDays = getActiveDays();

      // 调用实际 API
      const response = await updateMonitor(parseInt(id), {
        name: formData.name,
        url: formData.url,
        method: formData.method,
        interval: formData.interval * 60, // 转换为秒
        timeout: formData.timeout,
        expected_status: formData.expectedStatus, // 使用统一字段名
        headers: headersData,
        body: formData.body,
        active_timezone: timezone,
        active_windows: timeWindows.length > 0 ? timeWindows : undefined,
        active_days: activeDays,
      });

      if (response.success) {
        navigate(`/monitors/${id}`);
      } else {
        alert(
          `${t("monitor.form.updateFailed")}: ${
            response.message || t("monitor.form.unknownError")
          }`
        );
      }
    } catch (error) {
      console.error(t("monitor.form.updateFailed"), error);
      alert(t("monitor.form.updateFailed"));
    } finally {
      setLoading(false);
    }
  };

  // 判断是否需要显示请求体输入框
  const showBodyField = ["POST", "PUT", "PATCH"].includes(formData.method);

  if (loadingData) {
    return (
      <Box>
        <Flex justify="center" align="center">
          <Text>{t("common.loading")}</Text>
        </Flex>
      </Box>
    );
  }

  if (error) {
    return (
      <Box>
        <Flex justify="center" align="center">
          <Card>
            <Flex direction="column" align="center" gap="4" p="4">
              <Heading size="6">{t("monitor.notExist")}</Heading>
              <Text>{error}</Text>
              <Button onClick={() => navigate("/monitors")}>
                {t("monitor.returnToList")}
              </Button>
            </Flex>
          </Card>
        </Flex>
      </Box>
    );
  }

  return (
    <Container className="sm:px-6 lg:px-[8%]">
      <Flex justify="between" align="center" className="detail-header">
        <Flex align="center" gap="2">
          <Button
            variant="secondary"
            onClick={() => navigate(`/monitors/${id}`)}
          >
            <ArrowLeftIcon />
          </Button>
          <Heading size="6">
            {t("monitor.form.title.edit")}: {formData.name}
          </Heading>
        </Flex>
      </Flex>
      <Card className="my-4 pr-4">
        <form onSubmit={handleSubmit}>
          <Box pt="2">
            <Flex direction="column" gap="2" className="ml-4">
              <Box>
                <Text as="label" size="2">
                  {t("monitor.form.name")} *
                </Text>
                <TextField.Input
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder={t("monitor.form.namePlaceholder")}
                  required
                />
              </Box>

              <Box>
                <Text as="label" size="2">
                  URL *
                </Text>
                <TextField.Input
                  name="url"
                  value={formData.url}
                  onChange={handleChange}
                  placeholder={t("monitor.form.urlPlaceholder")}
                  required
                />
              </Box>

              <Box>
                <Text as="label" size="2">
                  {t("monitor.form.method")} *
                </Text>
                <Select
                  name="method"
                  value={formData.method}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, method: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GET">GET</SelectItem>
                    <SelectItem value="POST">POST</SelectItem>
                    <SelectItem value="PUT">PUT</SelectItem>
                    <SelectItem value="DELETE">DELETE</SelectItem>
                    <SelectItem value="HEAD">HEAD</SelectItem>
                  </SelectContent>
                </Select>
              </Box>

              <Flex gap="4">
                <Box>
                  <Text as="label" size="2">
                    {t("monitor.form.interval")} *
                  </Text>
                  <TextField.Input
                    name="interval"
                    type="number"
                    value={formData.interval.toString()}
                    onChange={handleChange}
                    min="1"
                    required
                  />
                  <Text size="1" color="gray">
                    {t("monitor.form.intervalMin")}
                  </Text>
                </Box>

                <Box>
                  <Text as="label" size="2">
                    {t("monitor.form.timeout")} *
                  </Text>
                  <TextField.Input
                    name="timeout"
                    type="number"
                    value={formData.timeout.toString()}
                    onChange={handleChange}
                    min="1"
                    required
                  />
                </Box>
              </Flex>

              <Box>
                <Text as="label" size="2">
                  {t("monitor.form.expectedStatus")} *
                </Text>
                <StatusCodeSelect
                  value={formData.expectedStatus}
                  onChange={handleStatusCodeChange}
                  required
                />
              </Box>

              <Box>
                <Text as="label" size="2">
                  {t("monitor.form.headers")}
                </Text>
                <Box>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableCell>{t("monitor.form.headerName")}</TableCell>
                        <TableCell>{t("monitor.form.headerValue")}</TableCell>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {headers.map((header, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <TextField.Input
                              placeholder={t(
                                "monitor.form.headerNamePlaceholder"
                              )}
                              value={header.key}
                              onChange={(e) =>
                                handleHeaderChange(index, "key", e.target.value)
                              }
                            />
                          </TableCell>
                          <TableCell>
                            <TextField.Input
                              placeholder={t(
                                "monitor.form.headerValuePlaceholder"
                              )}
                              value={header.value}
                              onChange={(e) =>
                                handleHeaderChange(
                                  index,
                                  "value",
                                  e.target.value
                                )
                              }
                            />
                          </TableCell>
                          <TableCell>
                            <IconButton
                              variant="soft"
                              color="red"
                              size="1"
                              onClick={(e) => {
                                e.preventDefault();
                                removeHeader(index);
                              }}
                            >
                              <TrashIcon />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <Flex justify="end" mt="2">
                    <Button
                      variant="secondary"
                      onClick={(e) => {
                        e.preventDefault();
                        setHeaders([...headers, { key: "", value: "" }]);
                      }}
                      type="button"
                    >
                      <PlusIcon />
                      {t("monitor.form.addHeader")}
                    </Button>
                  </Flex>
                </Box>
                <Text size="1" color="gray">
                  {t("monitor.form.headersHelp")}
                </Text>
              </Box>

              {showBodyField && (
                <Box>
                  <Text as="label" size="2">
                    {t("monitor.form.body")}
                  </Text>
                  <Textarea
                    name="body"
                    value={formData.body}
                    onChange={handleChange}
                    placeholder={t("monitor.form.bodyPlaceholder")}
                  />
                </Box>
              )}
              
              {/* 监控调度配置 */}
              <Box className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 mt-2">
                <Heading size="3" mb="1">{t("monitor.form.schedule")}</Heading>
                <Text size="1" color="gray" mb="3" as="p">{t("monitor.form.scheduleHelp")}</Text>
                
                {/* 时区选择 */}
                <Box mb="4">
                  <Text as="label" size="2" weight="medium">
                    {t("monitor.form.timezone")}
                  </Text>
                  <Box mt="1">
                    <Select value={timezone} onValueChange={setTimezone}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Asia/Shanghai">Asia/Shanghai (UTC+8)</SelectItem>
                        <SelectItem value="America/New_York">America/New_York (UTC-5)</SelectItem>
                        <SelectItem value="America/Los_Angeles">America/Los_Angeles (UTC-8)</SelectItem>
                        <SelectItem value="Europe/London">Europe/London (UTC+0)</SelectItem>
                        <SelectItem value="Europe/Paris">Europe/Paris (UTC+1)</SelectItem>
                        <SelectItem value="Asia/Tokyo">Asia/Tokyo (UTC+9)</SelectItem>
                        <SelectItem value="Australia/Sydney">Australia/Sydney (UTC+11)</SelectItem>
                        <SelectItem value="UTC">UTC</SelectItem>
                      </SelectContent>
                    </Select>
                  </Box>
                  <Text size="1" color="gray">{t("monitor.form.timezoneHelp")}</Text>
                </Box>
                
                {/* 时间窗口 */}
                <Box mb="4">
                  <Text as="label" size="2" weight="medium">
                    {t("monitor.form.activeWindows")}
                  </Text>
                  <Box mt="1">
                    {timeWindows.map((window, index) => (
                      <Flex key={index} gap="3" align="center" mb="2" className="flex-wrap sm:flex-nowrap">
                        <Box className="flex-1 min-w-[120px]">
                          <TextField.Input
                            type="time"
                            value={window.start}
                            onChange={(e) => updateTimeWindow(index, "start", e.target.value)}
                            placeholder={t("monitor.form.startTime")}
                          />
                        </Box>
                        <Text color="gray" size="2" className="shrink-0">–</Text>
                        <Box className="flex-1 min-w-[120px]">
                          <TextField.Input
                            type="time"
                            value={window.end}
                            onChange={(e) => updateTimeWindow(index, "end", e.target.value)}
                            placeholder={t("monitor.form.endTime")}
                          />
                        </Box>
                        <IconButton
                          variant="soft"
                          color="red"
                          size="2"
                          onClick={() => removeTimeWindow(index)}
                          type="button"
                          className="shrink-0"
                        >
                          <TrashIcon />
                        </IconButton>
                      </Flex>
                    ))}
                    <Button
                      variant="secondary"
                      onClick={(e) => {
                        e.preventDefault();
                        addTimeWindow();
                      }}
                      type="button"
                      className="mt-1"
                    >
                      <PlusIcon />
                      {t("monitor.form.addTimeWindow")}
                    </Button>
                  </Box>
                  <Text size="1" color="gray" as="p" className="mt-1">{t("monitor.form.activeWindowsHelp")}</Text>
                </Box>
                
                {/* 活跃天数 */}
                <Box>
                  <Text as="label" size="2" weight="medium">
                    {t("monitor.form.activeDays")}
                  </Text>
                  <Box mt="1" mb="2">
                    <Flex gap="2" wrap="wrap">
                      <Button
                        variant={dayPreset === "everyday" ? "default" : "outline"}
                        onClick={(e) => { e.preventDefault(); handleDayPresetChange("everyday"); }}
                        type="button"
                        size="sm"
                      >
                        {t("monitor.form.everyday")}
                      </Button>
                      <Button
                        variant={dayPreset === "workdays" ? "default" : "outline"}
                        onClick={(e) => { e.preventDefault(); handleDayPresetChange("workdays"); }}
                        type="button"
                        size="sm"
                      >
                        {t("monitor.form.workdays")}
                      </Button>
                      <Button
                        variant={dayPreset === "weekends" ? "default" : "outline"}
                        onClick={(e) => { e.preventDefault(); handleDayPresetChange("weekends"); }}
                        type="button"
                        size="sm"
                      >
                        {t("monitor.form.weekends")}
                      </Button>
                      <Button
                        variant={dayPreset === "custom" ? "default" : "outline"}
                        onClick={(e) => { e.preventDefault(); setDayPreset("custom"); }}
                        type="button"
                        size="sm"
                      >
                        {t("monitor.form.custom")}
                      </Button>
                    </Flex>
                  </Box>
                  {dayPreset === "custom" && (
                    <Flex gap="3" wrap="wrap" mt="2">
                      {[
                        { day: 0, label: t("monitor.form.sunday") },
                        { day: 1, label: t("monitor.form.monday") },
                        { day: 2, label: t("monitor.form.tuesday") },
                        { day: 3, label: t("monitor.form.wednesday") },
                        { day: 4, label: t("monitor.form.thursday") },
                        { day: 5, label: t("monitor.form.friday") },
                        { day: 6, label: t("monitor.form.saturday") },
                      ].map(({ day, label }) => (
                        <Box key={day}>
                          <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer" }}>
                            <Checkbox
                              checked={customDays.includes(day)}
                              onCheckedChange={() => toggleCustomDay(day)}
                            />
                            <Text size="2">{label}</Text>
                          </label>
                        </Box>
                      ))}
                    </Flex>
                  )}
                  <Text size="1" color="gray">{t("monitor.form.activeDaysHelp")}</Text>
                </Box>
              </Box>
            </Flex>
          </Box>

          <Flex justify="end" mt="4" gap="2">
            <Button
              variant="secondary"
              onClick={() => navigate(`/monitors/${id}`)}
            >
              {t("monitor.form.cancel")}
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? t("common.savingChanges") : t("common.saveChanges")}
              {!loading && <UpdateIcon />}
            </Button>
          </Flex>
        </form>
      </Card>
    </Container>
  );
};

export default EditMonitor;
