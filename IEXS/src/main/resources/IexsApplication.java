package org.example;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Spring Boot 主启动类
 */
@SpringBootApplication
@MapperScan("org.example.mapper")  // 扫描Mapper接口
public class IexsApplication {

    public static void main(String[] args) {
        SpringApplication.run(IexsApplication.class, args);
        System.out.println("========================================");
        System.out.println("智慧考试系统启动成功！");
        System.out.println("访问地址: http://localhost:8080");
        System.out.println("API文档: http://localhost:8080/api/");
        System.out.println("========================================");
    }
}

